package bank.loan.credit_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import bank.loan.credit_service.model.Loan;

public interface LoanRepository extends JpaRepository<Loan, Long> {}
