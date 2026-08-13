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

@Component("notifyClientDelegate")
public class NotifyClientDelegate implements JavaDelegate {

    private final NotificationService notificationService;
    private final WorkflowService workflowService;
    private final RabbitTemplate rabbitTemplate;

    public NotifyClientDelegate(NotificationService notificationService,WorkflowService workflowService,RabbitTemplate rabbitTemplate) {
        this.notificationService = notificationService;
        this.workflowService = workflowService;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long Client = (Long) execution.getVariable("clientId");
        Long loanId = (Long) execution.getVariable("loanId");
        Boolean isApprovedObj = (Boolean) execution.getVariable("is_approved");
        boolean isapproved = isApprovedObj != null && isApprovedObj;
        UserResponse user = workflowService.fetchUser(Client);

        String message;
        EmailRequest mail;
        if (isapproved) {
            message = "Your loan application (LoanID: " + loanId + ") has been approved.";
            mail = new EmailRequest(user.email(), EmailRequest.NotificationType.LOAN_APPROVED, Map.of(
                        "loanId", loanId.toString(),
                        "name", user.name()
                    ));
        } else {
            message = "Your loan application (LoanID: " + loanId + ") has been rejected.";
            mail = new EmailRequest(user.email(), EmailRequest.NotificationType.LOAN_REJECTED, Map.of(
                        "loanId", loanId.toString(),
                        "name", user.name()
                    ));
        }

        rabbitTemplate.convertAndSend("email.queue", mail);
        notificationService.processNotification(Client, loanId, message);
        System.out.println("[NOTIFICATION] Alerting Bank Client (" + Client + ") to check/correct the application.");
    }
}