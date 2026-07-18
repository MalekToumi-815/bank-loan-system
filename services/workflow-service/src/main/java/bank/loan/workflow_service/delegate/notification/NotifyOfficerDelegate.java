package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("notifyOfficerDelegate")
public class NotifyOfficerDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        String Officer = (String) execution.getVariable("loan_officer_id");
        System.out.println("[NOTIFICATION] Alerting Bank Officer (" + Officer + ") to check/correct the application.");
    }
}