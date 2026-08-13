package com.notification.notification_service.template;


import org.springframework.stereotype.Component;

import com.notification.notification_service.model.NotificationType;

import java.util.Map;

@Component
public class PasswordResetEmailStrategy implements EmailTemplateStrategy {

    @Override
    public NotificationType getSupportedType() {
        return NotificationType.PASSWORD_RESET;
    }

    @Override
    public EmailContent buildEmail(Map<String, String> variables, String frontendUrl) {
        String token = variables.get("token");
        String resetLink = frontendUrl + "/auth/reset-password?token=" + token;

        String subject = "Password Reset Request - Bank Loan System";
        String htmlBody = """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0056b3;">Password Reset Request</h2>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                <a href="%s" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 15px 0;">
                    Reset Password
                </a>
                <p style="font-size: 14px; color: #555;">This link will expire in 15 minutes.</p>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            """.formatted(resetLink);

        return new EmailContent(subject, htmlBody);
    }
}
