package bank.loan.workflow_service.dto;

import bank.loan.workflow_service.model.LoanType;

public record LoanRequest(
        float amount,
        LoanType type,
        int durationMonths
) {
}
