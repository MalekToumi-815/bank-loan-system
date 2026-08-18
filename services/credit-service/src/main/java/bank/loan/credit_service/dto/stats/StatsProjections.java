package bank.loan.credit_service.dto.stats;

public class StatsProjections {

    public interface LoanTypeCountProjection {
        String getType();
        Long getCount();
        Double getTotalAmount();
    }

    public interface RiskScoreDistributionProjection {
        String getRiskScore();
        Long getCount();
        Double getAvgAmount();
    }

    public interface AdminPortfolioProjection {
        Double getTotalRequested();
        Double getTotalApproved();
        Long getTotalLoans();
        Long getApprovedLoans();
        Long getRejectedLoans();
        Double getAvgApprovedDuration();
        Double getAvgApprovedInterestRate();
    }

    public interface PipelineStageProjection {
        String getWorkflowTask();
        Long getCount();
        Double getTotalAmount();
    }

    public interface PortfolioByTypeProjection {
        String getType();
        Long getApprovedCount();
        Double getApprovedAmount();
        Double getAvgInterestRate();
    }

    public interface TaskTurnaroundProjection {
        java.util.Date getSubmissionDate();
        java.util.Date getIntakeCompletedDate();
        java.util.Date getAssessmentCompletedDate();
    }
}
