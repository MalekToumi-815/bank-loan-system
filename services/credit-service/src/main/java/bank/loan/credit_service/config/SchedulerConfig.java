package bank.loan.credit_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling // Enables Spring's background task execution
public class SchedulerConfig {
    // If you use ShedLock for multi-instance deployments, configure the LockProvider Bean here
}
