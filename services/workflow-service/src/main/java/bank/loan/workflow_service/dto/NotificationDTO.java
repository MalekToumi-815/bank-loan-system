package bank.loan.workflow_service.dto;

import java.util.Date;

public record NotificationDTO(Long id , Long loanId , Long userId , String message , Date timestamp , boolean read) {}
