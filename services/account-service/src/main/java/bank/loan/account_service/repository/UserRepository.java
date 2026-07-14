package bank.loan.account_service.repository;

import bank.loan.account_service.model.Role;
import bank.loan.account_service.model.Status;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import bank.loan.account_service.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleAndStatus(Role role, Status status);
    List<User> findByRole(Role role);
    List<User> findByStatus(Status status);
}