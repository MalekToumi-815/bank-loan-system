package bank.loan.gateway_service.dto;

public record ValidationResponse(String status, String message, Long userId, String role, java.util.List<String> permissions) {
}