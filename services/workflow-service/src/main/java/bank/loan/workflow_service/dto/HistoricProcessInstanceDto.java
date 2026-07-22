package bank.loan.workflow_service.dto;

import java.util.Date;

public record HistoricProcessInstanceDto(
    String processInstanceId,
    String processDefinitionKey,
    Date startTime,
    Date endTime,
    String deleteReason, 
    Long loanId
) {}