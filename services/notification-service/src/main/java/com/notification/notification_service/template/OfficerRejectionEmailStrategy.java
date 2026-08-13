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

        String subject = "Loan Review Update - Action Required";
        String htmlBody = """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #e0a800;">Loan Review Update ⚠️</h2>
                <p>Hello %s,</p>
                <p>Your loan Task (ID: <b>%s</b>) was reviewed by an officer and requires updates.</p>
            </div>
            """.formatted(recipientName, loanId);

        return new EmailContent(subject, htmlBody);
    }
}