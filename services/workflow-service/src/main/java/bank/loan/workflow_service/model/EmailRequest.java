package bank.loan.workflow_service.model;

import java.util.Map;

public record EmailRequest(
        String to,
        NotificationType type,
        Map<String, String> variables
) {
    public enum NotificationType {
        ASSIGNMENT,
        OFFICER_REJECTION,
        LOAN_APPROVED,
        LOAN_REJECTED,
        PASSWORD_RESET
    }
}