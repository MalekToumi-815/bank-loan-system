package bank.loan.workflow_service.delegate.assignement;

import bank.loan.workflow_service.model.Role;
import bank.loan.workflow_service.service.WorkflowService;
import bank.loan.workflow_service.service.WorkflowService.UserResponse;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component("assignAdminDelegate")
public class AssignAdminDelegate implements JavaDelegate {

    private final WorkflowService workflowService;

    public AssignAdminDelegate(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        List<UserResponse> activeAdmins = workflowService.fetchUsers(Role.BANK_ADMIN);

        if (activeAdmins == null || activeAdmins.isEmpty()) {
            throw new IllegalStateException("Cannot assign loan: No active bank admins found.");
        }

        int randomIndex = ThreadLocalRandom.current().nextInt(activeAdmins.size());
        UserResponse selectedAdmin = activeAdmins.get(randomIndex);
        System.out.println("[SERVICE TASK] Automatically assigned Bank Admin (" + selectedAdmin.id() + ")...");
        execution.setVariable("bank_admin_id", selectedAdmin.id());
    }
}