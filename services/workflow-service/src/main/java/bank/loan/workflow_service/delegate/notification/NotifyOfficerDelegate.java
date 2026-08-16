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

@Component("notifyOfficerDelegate")
public class NotifyOfficerDelegate implements JavaDelegate {

    private final NotificationService notificationService;
    private final WorkflowService workflowService;
    private final RabbitTemplate rabbitTemplate;

    public NotifyOfficerDelegate(NotificationService notificationService,WorkflowService workflowService,RabbitTemplate rabbitTemplate) {
        this.notificationService = notificationService;
        this.workflowService = workflowService;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long Officer = (Long) execution.getVariable("loan_officer_id");
        Long loanId = (Long) execution.getVariable("loanId");
        String type = (String) execution.getVariable("loanType");
        UserResponse user = workflowService.fetchUser(Officer);
        String message = "You have a new Task (LoanID: " + loanId + ")";
        EmailRequest mail = new EmailRequest(user.email(), EmailRequest.NotificationType.ASSIGNMENT, Map.of(
                        "loanId", loanId.toString(),
                        "name", user.name(),
                        "type", type
                    ));
        notificationService.processNotification(Officer, loanId, message);
        rabbitTemplate.convertAndSend("email.queue", mail);
        System.out.println("[NOTIFICATION] Alerting Bank Officer (" + Officer + ") to check/correct the application.");
    }
}