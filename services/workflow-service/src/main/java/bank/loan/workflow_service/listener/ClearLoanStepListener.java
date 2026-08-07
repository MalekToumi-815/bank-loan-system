package bank.loan.workflow_service.listener;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.ExecutionListener;
import org.springframework.stereotype.Component;

import bank.loan.workflow_service.service.WorkflowService;

@Component("clearLoanStepListener")
public class ClearLoanStepListener implements ExecutionListener {

    private final WorkflowService workflowService;

    public ClearLoanStepListener(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Override
    public void notify(DelegateExecution execution) {
        Long loanId = (Long) execution.getVariable("loanId");

        if (loanId != null) {
            workflowService.updateWorkflowStep(loanId, "COMPLETED");
        }
    }
}