package bank.loan.credit_service.dto;

import java.util.Date;

import bank.loan.credit_service.model.LoanStatus;
import bank.loan.credit_service.model.LoanType;

public record LoanResponse(
        Long id,
        Date submissionDate,
        float amount,
        LoanType type,
        int durationMonths,
        float interestRate,
        String workflowProcessInstanceId,
        LoanStatus status
) {
}
