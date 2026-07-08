package bank.loan.oauth_service.dto;

public record ValidationResponse(String status, String message, Long userId) {
}