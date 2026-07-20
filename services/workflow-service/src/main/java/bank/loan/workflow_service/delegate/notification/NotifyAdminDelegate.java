package bank.loan.workflow_service.delegate.notification;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("notifyAdminDelegate")
public class NotifyAdminDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        Long Admin = (Long) execution.getVariable("bank_admin_id");
        System.out.println("[NOTIFICATION] Alerting Bank Admin (" + Admin + ") to check/correct the application.");
    }
}