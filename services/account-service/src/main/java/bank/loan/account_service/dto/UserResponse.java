package bank.loan.account_service.dto;
import bank.loan.account_service.model.Role;
import bank.loan.account_service.model.Status;

public record UserResponse(Long id, String name, String surname, String cin, String phone, String email, Role role, Status status) {
}