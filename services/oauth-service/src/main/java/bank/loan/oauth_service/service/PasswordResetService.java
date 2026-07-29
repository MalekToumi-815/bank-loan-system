package bank.loan.oauth_service.service;

import bank.loan.oauth_service.model.PasswordResetToken;
import bank.loan.oauth_service.repository.PasswordResetTokenRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
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
                                PasswordEncoder passwordEncoder,
                                @Value("${internal.shared-secret}") String internalSecret) {
        this.tokenRepository = tokenRepository;
        this.restClient = restClientBuilder.build();
        this.notifier = notifier;
        this.passwordEncoder = passwordEncoder;
        this.internalSecret = internalSecret;
    }

    // --- FORGOT PASSWORD FLOW ---

    public void processForgotPassword(String email) {
        try {
            // 1. Fetch userId OUTSIDE transaction so exceptions won't trigger UnexpectedRollbackException
            Long userId = getUserIdByEmail(email);

            if (userId != null) {
                // 2. Persist token in a clean, dedicated transaction
                createAndSaveResetToken(userId, email);
            }
        } catch (Exception e) {
            // Log error silently to prevent email enumeration attacks
            System.err.println("Error processing forgot-password: " + e.getMessage());
        }
    }

    @Transactional
    protected void createAndSaveResetToken(Long userId, String email) {
        // Clear any existing reset tokens for this user
        tokenRepository.deleteByUserId(userId);

        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(token, userId, expiryDate);
        tokenRepository.save(resetToken);

        // Send notification
        notifier.sendResetLink(email, token);
    }

    // --- RESET PASSWORD FLOW ---

    public void processPasswordReset(String token, String rawNewPassword) {
        // 1. Validate and fetch token from DB
        PasswordResetToken resetToken = validateAndFetchToken(token);

        // 2. Execute HTTP password update call to account-service OUTSIDE DB transaction
        String encodedPassword = passwordEncoder.encode(rawNewPassword);
        updatePassword(resetToken.getUserId(), encodedPassword);

        // 3. Mark token as used after successful HTTP call
        markTokenAsUsed(resetToken);
    }

    @Transactional(readOnly = true)
    protected PasswordResetToken validateAndFetchToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new IllegalArgumentException("Reset token is expired or already used");
        }
        return resetToken;
    }

    @Transactional
    protected void markTokenAsUsed(PasswordResetToken resetToken) {
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
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

        if (response == null || response.userId() == null || response.status() == null || !"SUCCESS".equals(response.status())) {
            throw new IllegalArgumentException("Could not find email");
        }

        return response.userId();
    }

    private void updatePassword(Long userId, String encodedPassword) {
        restClient.put()
                .uri("http://account-service/users/" + userId + "/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Internal-Secret", internalSecret)
                .body(new PasswordUpdateRequest(encodedPassword))
                .retrieve()
                .toBodilessEntity();
    }

    private record AccountAuthRequest(String email) {}

    private record AccountAuthResponse(String status, String message, Long userId, String password, String role, java.util.List<String> permissions) {}

    private record PasswordUpdateRequest(String newPassword) {}
}