package bank.loan.credit_service.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import bank.loan.credit_service.model.Loan;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByClientId(Long clientId);
}

