package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import bank.loan.workflow_service.service.NotificationService;

@Component("notifyClientDelegate")
public class NotifyClientDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    public NotifyClientDelegate(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long Client = (Long) execution.getVariable("client_id");
        Long loanId = (Long) execution.getVariable("loanId");
        Boolean isApprovedObj = (Boolean) execution.getVariable("is_approved");
        boolean isapproved = isApprovedObj != null && isApprovedObj;

        String message;
        if (isapproved) {
            message = "Your loan application (LoanID: " + loanId + ") has been approved.";
        } else {
            message = "Your loan application (LoanID: " + loanId + ") has been rejected.";
        }

        notificationService.processNotification(Client, loanId, message);
        System.out.println("[NOTIFICATION] Alerting Bank Client (" + Client + ") to check/correct the application.");
    }
}