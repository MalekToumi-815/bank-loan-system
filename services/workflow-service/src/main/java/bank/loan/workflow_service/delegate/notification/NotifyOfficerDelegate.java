package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import bank.loan.workflow_service.service.NotificationService;

@Component("notifyOfficerDelegate")
public class NotifyOfficerDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    public NotifyOfficerDelegate(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long Officer = (Long) execution.getVariable("loan_officer_id");
        Long loanId = (Long) execution.getVariable("loanId");
        String message = "You have a new Task (LoanID: " + loanId + ")";

        notificationService.processNotification(Officer, loanId, message);
        System.out.println("[NOTIFICATION] Alerting Bank Officer (" + Officer + ") to check/correct the application.");
    }
}