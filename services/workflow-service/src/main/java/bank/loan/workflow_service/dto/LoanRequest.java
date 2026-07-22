package bank.loan.workflow_service.dto;


public record LoanRequest(
        float amount,
        LoanType type,
        int durationMonths
) {
}
