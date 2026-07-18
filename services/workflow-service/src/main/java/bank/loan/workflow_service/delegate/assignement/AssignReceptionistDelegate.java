package bank.loan.workflow_service.delegate.assignement;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("assignReceptionistDelegate")
public class AssignReceptionistDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        System.out.println("[SERVICE TASK] Automatically assigning a Bank Receptionist...");
        
        // Hardcode a dummy user ID. 
        execution.setVariable("receptionist_id", "receptionist_test_user");
        
        System.out.println("[SERVICE TASK] Assigned to: receptionist_test_user");
    }
}