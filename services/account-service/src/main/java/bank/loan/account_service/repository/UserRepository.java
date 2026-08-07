package bank.loan.account_service.repository;

import bank.loan.account_service.model.Role;
import bank.loan.account_service.model.Status;
import bank.loan.account_service.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleAndStatus(Role role, Status status);
    List<User> findByRole(Role role);
    List<User> findByStatus(Status status);

    Page<User> findByRoleAndStatus(Role role, Status status, Pageable pageable);
    Page<User> findByRole(Role role, Pageable pageable);
    Page<User> findByStatus(Status status, Pageable pageable);

    @Query("""
        select u from User u
        where u.role = :role
            and u.status = :status
            and (
                lower(u.name) like lower(concat(:search, '%'))
            or lower(u.surname) like lower(concat(:search, '%'))
            or lower(u.email) like lower(concat(:search, '%'))
            or cast(u.id as string) like concat(:search, '%')
            )
        """)
    Page<User> findByRoleAndStatusAndSearchPrefix(
            @Param("role") Role role,
            @Param("status") Status status,
            @Param("search") String search,
            Pageable pageable);
}