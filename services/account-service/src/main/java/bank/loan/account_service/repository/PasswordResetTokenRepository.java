package bank.loan.account_service.repository;

import bank.loan.account_service.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    // THESE TWO ANNOTATIONS ARE REQUIRED FOR CUSTOM JPA DELETE QUERIES
    @Transactional
    @Modifying
    void deleteByUserId(Long userId);
}