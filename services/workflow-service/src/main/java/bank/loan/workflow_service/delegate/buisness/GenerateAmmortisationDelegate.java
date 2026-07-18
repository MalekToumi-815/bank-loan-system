package bank.loan.workflow_service.delegate.buisness;

import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("generateAmmortisationDelegate")
public class GenerateAmmortisationDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) {
        System.out.println("[BUSINESS] Generating Amortization Schedule.");
    }
}