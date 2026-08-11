package bank.loan.credit_service.dto.loan;

import java.util.Date;

public record NotificationDTO(Long id , Long loanId , Long userId , String message , Date timestamp , boolean read) {}
