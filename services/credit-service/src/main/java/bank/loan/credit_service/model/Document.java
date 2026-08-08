package bank.loan.credit_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Using Long for JPA standard entity keys

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FileExtension extension;

    @Column(nullable = false)
    private String filepath; // Stores the MinIO Object Key (e.g., "loans/101/uuid_paystub.pdf")

    @Column(nullable = false)
    private LocalDateTime date;

    @PrePersist
    protected void onCreate() {
        if (this.date == null) {
            this.date = LocalDateTime.now();
        }
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan; // Many documents can be associated with one loan

    public Document() {}

    public Document(FileExtension extension, String filepath) {
        this.extension = extension;
        this.filepath = filepath;
        this.date = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }

    public FileExtension getExtension() { return extension; }
    public void setExtension(FileExtension extension) { this.extension = extension; }

    public String getFilepath() { return filepath; }
    public void setFilepath(String filepath) { this.filepath = filepath; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }
}