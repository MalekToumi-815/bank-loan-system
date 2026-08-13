package bank.loan.workflow_service.delegate.notification;

import java.util.Map;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import org.springframework.amqp.rabbit.core.RabbitTemplate;

import bank.loan.workflow_service.service.NotificationService;
import bank.loan.workflow_service.service.WorkflowService;
import bank.loan.workflow_service.service.WorkflowService.UserResponse;
import bank.loan.workflow_service.model.EmailRequest;

@Component("notifyReceptionistDelegate")
public class NotifyReceptionistDelegate implements JavaDelegate {

    private final NotificationService notificationService;
    private final WorkflowService workflowService;
    private final RabbitTemplate rabbitTemplate;

    public NotifyReceptionistDelegate(NotificationService notificationService,WorkflowService workflowService,RabbitTemplate rabbitTemplate) {
        this.notificationService = notificationService;
        this.workflowService = workflowService;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long receptionist = (Long) execution.getVariable("receptionist_id");
        Long loanId = (Long) execution.getVariable("loanId");
        UserResponse user = workflowService.fetchUser(receptionist);
        
        String message;
        EmailRequest mail;
        // Check if loan_officer_id exists yet in the process variables
        if (!execution.hasVariable("loan_officer_id")) {
            message = "You have a new Task (LoanID: " + loanId + ")";
            mail = new EmailRequest(user.email(), EmailRequest.NotificationType.ASSIGNMENT, Map.of(
                        "loanId", loanId.toString(),
                        "name", user.name()
                    ));
        } else {
            message = "A Loan officer has requested you to recheck your Task (LoanID: " + loanId + ")";
            mail = new EmailRequest(user.email(), EmailRequest.NotificationType.OFFICER_REJECTION, Map.of(
                        "loanId", loanId.toString(),
                        "name", user.name()
                    ));
        }

        // Save to DB and push real-time WebSocket notification
        rabbitTemplate.convertAndSend("email.queue", mail);
        notificationService.processNotification(receptionist, loanId, message);

        System.out.println("[NOTIFICATION] Alerting Receptionist (" + receptionist + ") to check/correct the application.");
    }
}