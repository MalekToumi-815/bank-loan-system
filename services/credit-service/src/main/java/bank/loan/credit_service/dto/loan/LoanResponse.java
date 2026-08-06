package bank.loan.credit_service.dto.loan;

import java.util.Date;

import bank.loan.credit_service.model.LoanStatus;
import bank.loan.credit_service.model.LoanType;

public record LoanResponse(
        Long id,
        Date submissionDate,
        Date startDate,
        float amount,
        LoanType type,
        int durationMonths,
        float interestRate,
        String workflowProcessInstanceId,
        LoanStatus status,
        String finalDecision,
        Long clientId,
        Long receptionistId,
        Long creditOfficerId,
        Long bankAdminId,
        String OfficerrejectionReason,
        String AdminrejectionReason
) {
}
