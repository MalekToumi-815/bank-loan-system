package com.notification.notification_service.template;


import org.springframework.stereotype.Component;

import com.notification.notification_service.model.NotificationType;

import java.util.Map;

@Component
public class LoanApprovedEmailStrategy implements EmailTemplateStrategy {

    @Override
    public NotificationType getSupportedType() {
        return NotificationType.LOAN_APPROVED;
    }

    @Override
    public EmailContent buildEmail(Map<String, String> variables, String frontendUrl) {
        String loanId = variables.get("loanId");
        String recipientName = variables.get("name");
        String type = variables.get("type");

        String subject = "Congratulations! Your Loan Has Been Approved";
        String htmlBody = """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #28a745;">Loan Approved 🎉</h2>
                <p>Hello %s,</p>
                <p>Great news! Your %s application (ID: <b>%s</b>) has been successfully approved.</p>
            </div>
            """.formatted(recipientName, type,loanId);

        return new EmailContent(subject, htmlBody);
    }
}
