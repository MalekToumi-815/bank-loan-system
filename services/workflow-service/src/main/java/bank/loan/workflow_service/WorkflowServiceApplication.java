package bank.loan.workflow_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.flowable.spring.boot.FlowableSecurityAutoConfiguration;

@SpringBootApplication(exclude = { 
    FlowableSecurityAutoConfiguration.class 
})
public class WorkflowServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(WorkflowServiceApplication.class, args);
	}

}
