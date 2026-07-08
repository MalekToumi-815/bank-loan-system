package bank.loan.account_service.dto;

public record AuthResponse(String status, String message, Long userId, String password) {
}