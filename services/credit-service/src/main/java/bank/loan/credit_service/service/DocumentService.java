package bank.loan.credit_service.service;

import bank.loan.credit_service.dto.loan.DocumentDTO;
import bank.loan.credit_service.model.Document;
import bank.loan.credit_service.model.FileExtension;
import bank.loan.credit_service.model.Loan;
import bank.loan.credit_service.repository.DocumentRepository;
import bank.loan.credit_service.repository.LoanRepository;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class DocumentService {

    private final MinioClient minioClient;
    private final DocumentRepository documentRepository;
    private final LoanRepository loanRepository;

    @Value("${minio.bucket}")
    private String bucketName;

    public DocumentService(MinioClient minioClient,
                           DocumentRepository documentRepository,
                           LoanRepository loanRepository) {
        this.minioClient = minioClient;
        this.documentRepository = documentRepository;
        this.loanRepository = loanRepository;
    }

    @Transactional // Ensures MinIO operations and JPA modifications happen within a transaction scope
    public DocumentDTO uploadDocument(Long loanId, MultipartFile file) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan not found with id: " + loanId));

        String originalFilename = file.getOriginalFilename();
        FileExtension extension = extractExtension(originalFilename);

        // Path structure in MinIO: loans/{loanId}/{UUID}_{originalFilename}
        String objectKey = "loans/" + loanId + "/" + UUID.randomUUID() + "_" + originalFilename;

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to MinIO", e);
        }

        Document document = new Document(extension, objectKey);
        document.setLoan(loan); // 👈 Link foreign key

        // Save only the document (creates exactly 1 DB record)
        Document savedDocument = documentRepository.save(document); 

        return convertToDTO(savedDocument);
    }

    public List<DocumentDTO> getDocumentsByLoan(Long loanId) {
        return documentRepository.findByLoanId(loanId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public String generateDocumentUrl(Long documentId, boolean inline) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));
        
        // Force "inline" for preview, or "attachment" for automatic download
        String dispositionType = inline ? "inline" : "attachment";
        String fileName = document.getFilepath().substring(document.getFilepath().lastIndexOf("_") + 1);
        
        Map<String, String> extraQueryParams = Map.of(
            "response-content-disposition", dispositionType + "; filename=\"" + fileName + "\""
        );
    
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(document.getFilepath())
                            .expiry(15, TimeUnit.MINUTES)
                            .extraQueryParams(extraQueryParams) // 👈 Directs browser to preview or download
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }

    private FileExtension extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("Filename must contain an extension");
        }
        String extStr = filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
        try {
            return FileExtension.valueOf(extStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported file extension: " + extStr);
        }
    }

    private DocumentDTO convertToDTO(Document document) {
        return new DocumentDTO(
                document.getId(),
                document.getExtension().name(),
                document.getFilepath(),
                document.getDate().toString(),
                document.getLoan().getId()
        );
    }
}
