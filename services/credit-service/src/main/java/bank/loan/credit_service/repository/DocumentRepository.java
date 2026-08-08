package bank.loan.credit_service.repository;

import bank.loan.credit_service.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Spring Data JPA generates the SQL query automatically based on the method name
    List<Document> findByLoanId(Long loanId);

}