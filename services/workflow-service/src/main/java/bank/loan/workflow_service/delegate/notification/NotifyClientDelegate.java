package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("notifyClientDelegate")
public class NotifyClientDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        String Client = (String) execution.getVariable("client_id");
        System.out.println("[NOTIFICATION] Alerting Bank Client (" + Client + ") to check/correct the application.");
    }
}