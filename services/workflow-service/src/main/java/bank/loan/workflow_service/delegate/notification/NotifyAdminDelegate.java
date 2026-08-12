package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import bank.loan.workflow_service.service.NotificationService;

@Component("notifyAdminDelegate")
public class NotifyAdminDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    public NotifyAdminDelegate(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long Admin = (Long) execution.getVariable("bank_admin_id");
        Long loanId = (Long) execution.getVariable("loanId");
        String message = "You have a new Task (LoanID: " + loanId + ")";

        notificationService.processNotification(Admin, loanId, message);
        System.out.println("[NOTIFICATION] Alerting Bank Admin (" + Admin + ") to check/correct the application.");
    }
}