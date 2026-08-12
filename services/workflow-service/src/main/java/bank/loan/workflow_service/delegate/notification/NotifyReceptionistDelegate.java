package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import bank.loan.workflow_service.service.NotificationService;

@Component("notifyReceptionistDelegate")
public class NotifyReceptionistDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    public NotifyReceptionistDelegate(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long receptionist = (Long) execution.getVariable("receptionist_id");
        Long loanId = (Long) execution.getVariable("loanId");
        
        String message;

        // Check if loan_officer_id exists yet in the process variables
        if (!execution.hasVariable("loan_officer_id")) {
            message = "You have a new Task (LoanID: " + loanId + ")";
        } else {
            message = "A Loan officer has requested you to recheck your Task (LoanID: " + loanId + ")";
        }

        // Save to DB and push real-time WebSocket notification
        notificationService.processNotification(receptionist, loanId, message);

        System.out.println("[NOTIFICATION] Alerting Receptionist (" + receptionist + ") to check/correct the application.");
    }
}