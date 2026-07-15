package bank.loan.credit_service.dto;

import java.util.Date;

import bank.loan.credit_service.model.LoanType;

public record LoanRequest(
        Date submissionDate,
        float amount,
        LoanType type,
        int durationMonths,
        float interestRate
) {
}
