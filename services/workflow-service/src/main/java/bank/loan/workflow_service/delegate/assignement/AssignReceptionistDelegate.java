package bank.loan.workflow_service.delegate.assignement;

import bank.loan.workflow_service.model.Role;
import bank.loan.workflow_service.service.WorkflowService;
import bank.loan.workflow_service.service.WorkflowService.UserResponse;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component("assignReceptionistDelegate")
public class AssignReceptionistDelegate implements JavaDelegate {

    private final WorkflowService workflowService;

    public AssignReceptionistDelegate(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        List<UserResponse> activeReceptionists = workflowService.fetchUsers(Role.BANK_RECEPTIONIST);

        if (activeReceptionists == null || activeReceptionists.isEmpty()) {
            throw new IllegalStateException("Cannot assign loan: No active bank receptionists found.");
        }

        int randomIndex = ThreadLocalRandom.current().nextInt(activeReceptionists.size());
        UserResponse selectedReceptionist = activeReceptionists.get(randomIndex);
        System.out.println("[SERVICE TASK] Automatically assigned Bank Receptionist (" + selectedReceptionist.id() + ")...");
        execution.setVariable("receptionist_id", selectedReceptionist.id());
    }
}