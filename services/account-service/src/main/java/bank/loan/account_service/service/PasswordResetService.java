package bank.loan.account_service.service;

import bank.loan.account_service.model.PasswordResetToken;
import bank.loan.account_service.repository.PasswordResetTokenRepository;
import bank.loan.account_service.repository.UserRepository;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import bank.loan.account_service.model.User;
import bank.loan.account_service.model.EmailRequest;
import bank.loan.account_service.model.EmailRequest.NotificationType;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            RabbitTemplate rabbitTemplate) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    // --- FORGOT PASSWORD FLOW ---

    @Transactional
    public void processForgotPassword(String email) {
        try {
            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null) {
                // Delete old tokens safely
                tokenRepository.deleteByUserId(user.getId());
                tokenRepository.flush();

                String token = UUID.randomUUID().toString();
                LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

                PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
                tokenRepository.save(resetToken);

                // Build the message payload for RabbitMQ
                EmailRequest emailRequest = new EmailRequest(
                    email,
                    NotificationType.PASSWORD_RESET,
                    Map.of(
                        "token", token 
                    )
                );

                // Publish the message to the queue
                rabbitTemplate.convertAndSend("email.queue", emailRequest);
            }
        } catch (Exception e) {
            // Log silently to prevent email enumeration
            System.err.println("Error processing forgot-password: " + e.getMessage());
        }
    }

    // --- RESET PASSWORD FLOW ---

    @Transactional
    public boolean processPasswordReset(String token, String rawNewPassword) {
        // 1. Locate token safely without throwing exceptions
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();

        // 2. Validate token status
        if (resetToken.isUsed() || resetToken.isExpired()) {
            return false;
        }

        // 3. Encode new password
        String encodedPassword = passwordEncoder.encode(rawNewPassword);

        // 4. Update password
        User user = resetToken.getUser();
        user.setPassword(encodedPassword);
        userRepository.save(user);

        // 5. Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return true;
    }
}