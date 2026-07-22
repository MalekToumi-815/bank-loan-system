package bank.loan.credit_service.dto.loan;

import bank.loan.credit_service.model.LoanType;

public record LoanRequest(
        float amount,
        LoanType type,
        int durationMonths
) {
}
