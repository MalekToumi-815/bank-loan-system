package bank.loan.credit_service.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bank.loan.credit_service.model.Loan;
import bank.loan.credit_service.model.LoanStatus;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByClientId(Long clientId);

    @Query("SELECT l FROM Loan l WHERE (:clientId IS NULL OR l.clientId = :clientId) AND (:status IS NULL OR l.status = :status)")
    Page<Loan> findAllWithFilters(@Param("clientId") Long clientId, @Param("status") LoanStatus status, Pageable pageable);
}

