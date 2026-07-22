package bank.loan.workflow_service.dto;

import java.util.Date;

public record ProcessInstanceDto(
        String processInstanceId,
        String processDefinitionKey,
        Date startTime,
        Long loanId
) {
}
