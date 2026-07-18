package bank.loan.workflow_service.delegate.assignement;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("assignAdminDelegate")
public class AssignAdminDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        System.out.println("[SERVICE TASK] Automatically assigning a Bank Admin...");
        
        // Hardcode a dummy user ID.
        execution.setVariable("bank_admin_id", "admin_test_user");
        
        System.out.println("[SERVICE TASK] Assigned to: admin_test_user");
    }
}