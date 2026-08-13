package com.notification.notification_service.template;

import org.springframework.stereotype.Component;
import com.notification.notification_service.model.NotificationType;
import java.util.Map;

@Component
public class OfficerRejectionEmailStrategy implements EmailTemplateStrategy {

    @Override
    public NotificationType getSupportedType() {
        return NotificationType.OFFICER_REJECTION;
    }

    @Override
    public EmailContent buildEmail(Map<String, String> variables, String frontendUrl) {
        String loanId = variables.get("loanId");
        String recipientName = variables.get("name");
        String reason = variables.getOrDefault("reason", "No specific reason provided.");
        String dashboardLink = frontendUrl + "/loans/" + loanId;

        String subject = "Loan Review Update - Action Required";
        String htmlBody = """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #e0a800;">Loan Review Update ⚠️</h2>
                <p>Hello %s,</p>
                <p>Your loan Task (ID: <b>%s</b>) was reviewed by an officer and requires updates.</p>
                <p style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #e0a800;"><b>Reason:</b> %s</p>
                <a href="%s" style="background-color: #e0a800; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 15px 0;">
                    View Details
                </a>
            </div>
            """.formatted(recipientName, loanId, reason, dashboardLink);

        return new EmailContent(subject, htmlBody);
    }
}