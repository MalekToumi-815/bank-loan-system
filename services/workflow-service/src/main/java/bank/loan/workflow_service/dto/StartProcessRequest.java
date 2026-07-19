package bank.loan.workflow_service.dto;

import jakarta.validation.constraints.NotBlank;

public record StartProcessRequest(
    @NotBlank(message = "Loan ID is required to start the workflow")
    String loanId,
    
    @NotBlank(message = "Client ID is required to start the workflow")
    String clientId
) {}