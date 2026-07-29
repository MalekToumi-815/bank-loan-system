package bank.loan.oauth_service.repository;

import bank.loan.oauth_service.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    // Delete existing token for a user if they request a new reset link before using the old one
    void deleteByUserId(Long userId);
}