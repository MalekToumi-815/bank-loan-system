package bank.loan.workflow_service.dto;

import java.util.Date;

public record AdminTask(float amount,String finalDecision,int durationMonths,Date startDate) {
    
}