package bank.loan.oauth_service.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Primary
public class SmtpPasswordResetNotifier implements PasswordResetNotifier {

    private final JavaMailSender mailSender;
    private final String frontendUrl;

    public SmtpPasswordResetNotifier(JavaMailSender mailSender,
            @Value("${app.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void sendResetLink(String email, String token) {
        String resetLink = frontendUrl + "/auth/reset-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@bankloan.com");
            helper.setTo(email);
            helper.setSubject("Password Reset Request - Bank Loan System");

            String htmlContent = """
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #0056b3;">Password Reset Request</h2>
                        <p>You requested to reset your password. Click the button below to proceed:</p>

                        <a href="%s"
                           style="background-color: #007bff;
                                  color: #ffffff;
                                  padding: 12px 24px;
                                  text-decoration: none;
                                  border-radius: 5px;
                                  display: inline-block;
                                  font-weight: bold;
                                  margin: 15px 0;">
                            Reset Password
                        </a>

                        <p style="font-size: 14px; color: #555;">This link will expire in 15 minutes.</p>
                        <p style="color: #888; font-size: 12px; margin-top: 20px;">
                            If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>
                    """.formatted(resetLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Failed to send reset email to " + email + ": " + e.getMessage());
        }
    }
}