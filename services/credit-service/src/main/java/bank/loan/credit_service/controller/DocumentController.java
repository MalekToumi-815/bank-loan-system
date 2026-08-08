package bank.loan.credit_service.controller;

import bank.loan.credit_service.dto.loan.DocumentDTO;
import bank.loan.credit_service.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload/{loanId}")
    public ResponseEntity<DocumentDTO> uploadDocument(
            @PathVariable Long loanId,
            @RequestParam("file") MultipartFile file) {
        DocumentDTO uploaded = documentService.uploadDocument(loanId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(uploaded);
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<List<DocumentDTO>> getDocumentsByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(documentService.getDocumentsByLoan(loanId));
    }

    @GetMapping("/{documentId}/url")
    public ResponseEntity<Map<String, String>> getDocumentUrl(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "true") boolean preview) {
            
        String url = documentService.generateDocumentUrl(documentId, preview);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
