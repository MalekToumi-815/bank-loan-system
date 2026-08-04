package bank.loan.credit_service.scheduler;

import bank.loan.credit_service.model.InstallementStatus;
import bank.loan.credit_service.repository.InstallementRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Component
public class InstallementStatusScheduler {

    private final InstallementRepository installementRepository;

    public InstallementStatusScheduler(InstallementRepository installementRepository) {
        this.installementRepository = installementRepository;
    }

    // Runs every midnight at 00:00 AM
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void markOverdueInstallements() {
        System.out.println("Starting nightly installement status update job...");
        
        Date today = new Date();
        int updatedCount = installementRepository.updateStatusForPassedDueDates(
                InstallementStatus.PENDING,
                InstallementStatus.LATE,
                today
        );

        System.out.println("Finished status update job. {} installements marked as LATE. " + updatedCount);
    }
}
