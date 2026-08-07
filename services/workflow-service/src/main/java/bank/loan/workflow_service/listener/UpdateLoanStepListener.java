package bank.loan.workflow_service.listener;

import org.flowable.engine.delegate.TaskListener;
import org.flowable.task.service.delegate.DelegateTask; 
import org.springframework.stereotype.Component;

import bank.loan.workflow_service.service.WorkflowService;

@Component("updateLoanStepListener")
public class UpdateLoanStepListener implements TaskListener {

    private final WorkflowService workflowService;

    public UpdateLoanStepListener(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Override
    public void notify(DelegateTask delegateTask) {
        // Safe variable conversion to prevent ClassCastException
        Object rawLoanId = delegateTask.getVariable("loanId");
        Long loanId = (rawLoanId instanceof Number number) ? number.longValue() : null;
        
        String newTaskName = delegateTask.getName(); // e.g. "Risk Assessment"

        if (loanId != null) {
            workflowService.updateWorkflowStep(loanId, newTaskName);
        }
    }
}