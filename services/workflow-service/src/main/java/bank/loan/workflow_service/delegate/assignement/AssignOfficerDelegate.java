package bank.loan.workflow_service.delegate.assignement;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("assignOfficerDelegate")
public class AssignOfficerDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        System.out.println("[SERVICE TASK] Automatically assigning a Bank Officer...");
        
        // Hardcode a dummy user ID. 
        execution.setVariable("loan_officer_id", "officer_test_user");
        
        System.out.println("[SERVICE TASK] Assigned to: officer_test_user");
    }
}