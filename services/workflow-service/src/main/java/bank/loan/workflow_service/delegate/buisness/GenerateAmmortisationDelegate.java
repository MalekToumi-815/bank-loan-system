package bank.loan.workflow_service.delegate.buisness;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;
import bank.loan.workflow_service.service.WorkflowService;

@Component("generateAmmortisationDelegate")
public class GenerateAmmortisationDelegate implements JavaDelegate {

    private final WorkflowService workflowService;

    public GenerateAmmortisationDelegate(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Override
    public void execute(DelegateExecution execution) {
        System.out.println("[BUSINESS] Generating Amortization Schedule.");
        Long loanId = (Long) execution.getVariable("loanId");
        try {
            workflowService.generateAmortizationSchedule(loanId);
            System.out.println("[BUSINESS] Amortization schedule generated successfully for loanId: " + loanId);
        } catch (Exception e) {
            System.err.println("[BUSINESS] Failed to generate amortization schedule for loanId: " + loanId);
            e.printStackTrace();
        }
    }
}