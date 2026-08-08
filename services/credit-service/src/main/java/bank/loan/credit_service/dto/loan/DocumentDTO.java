package bank.loan.credit_service.dto.loan;

public record DocumentDTO (Long id, String extension, String filepath, String date, Long loanId) {
}
