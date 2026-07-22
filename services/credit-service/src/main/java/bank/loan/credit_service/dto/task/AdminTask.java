package bank.loan.credit_service.dto.task;

import java.util.Date;

public record AdminTask(float amount,String finalDecision,int durationMonths,Date startDate, String taskId) {
    
}
