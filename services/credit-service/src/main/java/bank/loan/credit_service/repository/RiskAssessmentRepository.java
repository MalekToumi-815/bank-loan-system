package bank.loan.credit_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bank.loan.credit_service.dto.stats.StatsProjections.RiskScoreDistributionProjection;
import bank.loan.credit_service.model.RiskAssessment;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {
    Optional<RiskAssessment> findByLoanId(Long loanId);

    @Query("""
        SELECT CAST(r.riskScore AS string) AS riskScore, COUNT(r) AS count, COALESCE(AVG(l.amount), 0.0) AS avgAmount
        FROM RiskAssessment r JOIN r.loan l
        WHERE (:officerId IS NULL OR l.creditOfficerId = :officerId)
        GROUP BY r.riskScore
    """)
    List<RiskScoreDistributionProjection> countGroupedByRiskScore(@Param("officerId") Long officerId);
}
