package bank.loan.credit_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import bank.loan.credit_service.model.RiskAssessment;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {
    Optional<RiskAssessment> findByLoanId(Long loanId);
}
