package bank.loan.account_service.dto;
import bank.loan.account_service.model.Role;
import bank.loan.account_service.model.Status;
import java.util.List;

public record UserResponse(Long id, String name, String surname, String cin, String phone, String email, Role role, Status status, List<String> permissions) {
}