package com.notification.notification_service.template;

import org.springframework.stereotype.Component;
import com.notification.notification_service.model.NotificationType;
import java.util.Map;

@Component
public class LoanRejectedEmailStrategy implements EmailTemplateStrategy {

    @Override
    public NotificationType getSupportedType() {
        return NotificationType.LOAN_REJECTED;
    }

    @Override
    public EmailContent buildEmail(Map<String, String> variables, String frontendUrl) {
        String loanId = variables.get("loanId");
        String recipientName = variables.get("name");
        String dashboardLink = frontendUrl + "/loans/" + loanId;

        String subject = "Update Regarding Your Loan Application";
        String htmlBody = """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #dc3545;">Loan Application Update ❌</h2>
                <p>Hello %s,</p>
                <p>We regret to inform you that your loan application (ID: <b>%s</b>) has been rejected after final evaluation.</p>
                <a href="%s" style="background-color: #dc3545; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 15px 0;">
                    View Loan Status
                </a>
            </div>
            """.formatted(recipientName, loanId, dashboardLink);

        return new EmailContent(subject, htmlBody);
    }
}