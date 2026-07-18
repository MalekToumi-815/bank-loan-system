package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("notifyReceptionistDelegate")
public class NotifyReceptionistDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        String receptionist = (String) execution.getVariable("receptionist_id");
        System.out.println("[NOTIFICATION] Alerting Bank Receptionist (" + receptionist + ") to check/correct the application.");
    }
}