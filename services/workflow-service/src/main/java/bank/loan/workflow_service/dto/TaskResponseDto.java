package bank.loan.workflow_service.dto;

public record TaskResponseDto(
    String taskId,
    String taskName,
    String taskDefinitionKey,
    String processInstanceId,
    Long loanId
) {}