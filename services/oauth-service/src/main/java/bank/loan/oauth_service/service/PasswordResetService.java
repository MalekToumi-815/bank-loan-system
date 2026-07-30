package bank.loan.oauth_service.service;

import bank.loan.oauth_service.model.PasswordResetToken;
import bank.loan.oauth_service.repository.PasswordResetTokenRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final RestClient restClient;
    private final PasswordResetNotifier notifier;
    private final PasswordEncoder passwordEncoder;
    private final String internalSecret;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
                                RestClient.Builder restClientBuilder,
                                PasswordResetNotifier notifier,
                                @Value("${internal.shared-secret}") String internalSecret) {
        this.tokenRepository = tokenRepository;
        this.restClient = restClientBuilder.build();
        this.notifier = notifier;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.internalSecret = internalSecret;
    }

    // --- FORGOT PASSWORD FLOW ---

    @Transactional
    public void processForgotPassword(String email) {
        try {
            Long userId = getUserIdByEmail(email);

            if (userId != null) {
                // Delete old tokens safely
                tokenRepository.deleteByUserId(userId);

                String token = UUID.randomUUID().toString();
                LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

                PasswordResetToken resetToken = new PasswordResetToken(token, userId, expiryDate);
                tokenRepository.save(resetToken);

                notifier.sendResetLink(email, token);
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

        // 4. Update password in account-service
        boolean updated = updatePasswordInAccountService(resetToken.getUserId(), encodedPassword);
        if (!updated) {
            return false;
        }

        // 5. Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return true;
    }

    // --- REST CLIENT HELPERS ---

    private Long getUserIdByEmail(String email) {
        AccountAuthRequest request = new AccountAuthRequest(email);
        AccountAuthResponse response = restClient.post()
                .uri("http://account-service/users/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Internal-Secret", internalSecret)
                .body(request)
                .retrieve()
                .body(AccountAuthResponse.class);

        if (response == null || response.userId() == null || !"SUCCESS".equals(response.status())) {
            return null;
        }

        return response.userId();
    }

    private boolean updatePasswordInAccountService(Long userId, String encodedPassword) {
        try {
            restClient.put()
                    .uri("http://account-service/users/" + userId + "/reset-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Secret", internalSecret)
                    .body(new PasswordUpdateRequest(encodedPassword))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            System.err.println("Failed to update password in account-service: " + e.getMessage());
            return false;
        }
    }

    private record AccountAuthRequest(String email) {}
    private record AccountAuthResponse(String status, String message, Long userId, String password, String role, java.util.List<String> permissions) {}
    private record PasswordUpdateRequest(String newPassword) {}
}