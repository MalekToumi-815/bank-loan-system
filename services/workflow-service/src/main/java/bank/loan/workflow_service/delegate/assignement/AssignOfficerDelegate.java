package bank.loan.workflow_service.delegate.assignement;

import bank.loan.workflow_service.service.WorkflowService;
import bank.loan.workflow_service.service.WorkflowService.UserResponse;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import bank.loan.workflow_service.model.Role;

@Component("assignOfficerDelegate")
public class AssignOfficerDelegate implements JavaDelegate {

    private final WorkflowService WorkflowService;

    public AssignOfficerDelegate(WorkflowService WorkflowService) {
        this.WorkflowService = WorkflowService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        // Fetch using the new shared function
        List<UserResponse> activeOfficers = WorkflowService.fetchUsers(Role.LOAN_OFFICER);

        if (activeOfficers == null || activeOfficers.isEmpty()) {
            throw new IllegalStateException("Cannot assign loan: No active loan officers found.");
        }

        // Select and assign variable
        int randomIndex = ThreadLocalRandom.current().nextInt(activeOfficers.size());
        UserResponse selectedOfficer = activeOfficers.get(randomIndex);
        System.out.println("[SERVICE TASK] Automatically assigned Bank Officer (" + selectedOfficer.id() + ")...");
        execution.setVariable("loan_officer_id", selectedOfficer.id());
    }
}