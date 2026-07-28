package bank.loan.account_service.dto;

import bank.loan.account_service.model.Role;

public record AuthResponse(String status, String message, Long userId, String password, Role role, java.util.List<String> permissions) {
}