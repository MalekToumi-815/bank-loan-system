package bank.loan.oauth_service.controller;

import bank.loan.oauth_service.service.PasswordResetService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.processForgotPassword(request.email());
        return ResponseEntity.ok(Map.of(
            "message", "If an account with that email exists, a password reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean success = passwordResetService.processPasswordReset(request.token(), request.newPassword());
        
        if (!success) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid, expired, or already used reset token."
            ));
        }

        return ResponseEntity.ok(Map.of(
            "message", "Password has been successfully reset. You can now log in."
        ));
    }

    // --- DTOs ---

    public record ForgotPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email
    ) {}

    public record ResetPasswordRequest(
        @NotBlank(message = "Token is required")
        String token,

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        String newPassword
    ) {}
}