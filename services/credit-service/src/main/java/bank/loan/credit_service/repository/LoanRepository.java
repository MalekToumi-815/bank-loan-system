package bank.loan.credit_service.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import bank.loan.credit_service.dto.loan.StatusCountProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.AdminPortfolioProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.LoanTypeCountProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.PipelineStageProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.PortfolioByTypeProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.TaskTurnaroundProjection;
import bank.loan.credit_service.model.Loan;
import bank.loan.credit_service.model.LoanStatus;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByClientId(Long clientId);

    @Query("SELECT l FROM Loan l WHERE (:clientId IS NULL OR l.clientId = :clientId) AND (:status IS NULL OR l.status = :status)")
    Page<Loan> findAllWithFilters(@Param("clientId") Long clientId, @Param("status") LoanStatus status, Pageable pageable);

    @Query("""
        SELECT CAST(l.status AS string) AS status, COUNT(l) AS count
        FROM Loan l
        WHERE (:clientId IS NULL OR l.clientId = :clientId)
        GROUP BY l.status
    """)
    List<StatusCountProjection> countLoansGroupedByStatus(@Param("clientId") Long clientId);

    // --- Receptionist Aggregations ---

    long countByReceptionistIdAndIntakeCompletedDateIsNotNull(Long receptionistId);

    @Query("SELECT COUNT(l) FROM Loan l WHERE (:receptionistId IS NULL OR l.receptionistId = :receptionistId) AND l.workflowTask = :workflowTask")
    long countByReceptionistIdAndWorkflowTask(@Param("receptionistId") Long receptionistId, @Param("workflowTask") String workflowTask);

    long countByReceptionistIdAndRejectionCountGreaterThan(Long receptionistId, int rejectionCount);

    @Query("""
        SELECT CAST(l.type AS string) AS type, COUNT(l) AS count, COALESCE(SUM(l.amount), 0.0) AS totalAmount
        FROM Loan l
        WHERE (:receptionistId IS NULL OR l.receptionistId = :receptionistId)
        GROUP BY l.type
    """)
    List<LoanTypeCountProjection> findLoanTypeCountsByReceptionistId(@Param("receptionistId") Long receptionistId);

    @Query("""
        SELECT l.submissionDate AS submissionDate, l.intakeCompletedDate AS intakeCompletedDate, l.assessmentCompletedDate AS assessmentCompletedDate
        FROM Loan l
        WHERE (:receptionistId IS NULL OR l.receptionistId = :receptionistId)
          AND l.intakeCompletedDate IS NOT NULL
          AND l.submissionDate IS NOT NULL
    """)
    List<TaskTurnaroundProjection> findIntakeTurnaroundDatesByReceptionistId(@Param("receptionistId") Long receptionistId);

    // --- Loan Officer Aggregations ---

    long countByCreditOfficerIdAndAssessmentCompletedDateIsNotNull(Long creditOfficerId);

    @Query("SELECT COUNT(l) FROM Loan l WHERE (:officerId IS NULL OR l.creditOfficerId = :officerId) AND l.workflowTask = :workflowTask")
    long countByCreditOfficerIdAndWorkflowTask(@Param("officerId") Long officerId, @Param("workflowTask") String workflowTask);

    long countByCreditOfficerIdAndRejectionCountGreaterThan(Long creditOfficerId, int rejectionCount);

    @Query("""
        SELECT l.submissionDate AS submissionDate, l.intakeCompletedDate AS intakeCompletedDate, l.assessmentCompletedDate AS assessmentCompletedDate
        FROM Loan l
        WHERE (:officerId IS NULL OR l.creditOfficerId = :officerId)
          AND l.assessmentCompletedDate IS NOT NULL
          AND l.intakeCompletedDate IS NOT NULL
    """)
    List<TaskTurnaroundProjection> findOfficerTurnaroundDatesByOfficerId(@Param("officerId") Long officerId);

    // --- Admin Portfolio & Pipeline Aggregations ---

    @Query("""
        SELECT 
            COALESCE(SUM(l.amount), 0.0) AS totalRequested,
            COALESCE(SUM(CASE WHEN l.status = bank.loan.credit_service.model.LoanStatus.APPROVED THEN l.amount ELSE 0.0 END), 0.0) AS totalApproved,
            COUNT(l) AS totalLoans,
            SUM(CASE WHEN l.status = bank.loan.credit_service.model.LoanStatus.APPROVED THEN 1L ELSE 0L END) AS approvedLoans,
            SUM(CASE WHEN l.status = bank.loan.credit_service.model.LoanStatus.REJECTED THEN 1L ELSE 0L END) AS rejectedLoans,
            COALESCE(AVG(CASE WHEN l.status = bank.loan.credit_service.model.LoanStatus.APPROVED THEN l.durationMonths ELSE NULL END), 0.0) AS avgApprovedDuration,
            COALESCE(AVG(CASE WHEN l.status = bank.loan.credit_service.model.LoanStatus.APPROVED THEN l.interestRate ELSE NULL END), 0.0) AS avgApprovedInterestRate
        FROM Loan l
    """)
    AdminPortfolioProjection getAdminPortfolioSummary();

    @Query("""
        SELECT l.workflowTask AS workflowTask, COUNT(l) AS count, COALESCE(SUM(l.amount), 0.0) AS totalAmount
        FROM Loan l
        WHERE l.status NOT IN (bank.loan.credit_service.model.LoanStatus.APPROVED, bank.loan.credit_service.model.LoanStatus.REJECTED)
          AND l.workflowTask IS NOT NULL
        GROUP BY l.workflowTask
    """)
    List<PipelineStageProjection> getActivePipelineStages();

    @Query("""
        SELECT 
            CAST(l.type AS string) AS type,
            COUNT(l) AS approvedCount,
            COALESCE(SUM(l.amount), 0.0) AS approvedAmount,
            COALESCE(AVG(l.interestRate), 0.0) AS avgInterestRate
        FROM Loan l
        WHERE l.status = bank.loan.credit_service.model.LoanStatus.APPROVED
        GROUP BY l.type
    """)
    List<PortfolioByTypeProjection> getApprovedPortfolioByType();
}
