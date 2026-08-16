package com.notification.notification_service.template;

import org.springframework.stereotype.Component;
import com.notification.notification_service.model.NotificationType;
import java.util.Map;

@Component
public class AssignmentEmailStrategy implements EmailTemplateStrategy {

    @Override
    public NotificationType getSupportedType() {
        return NotificationType.ASSIGNMENT;
    }

    @Override
    public EmailContent buildEmail(Map<String, String> variables, String frontendUrl) {
        String loanId = variables.get("loanId");
        String recipientName = variables.get("name");
        String type = variables.get("type");

        String subject = "New Loan Task Assigned - Bank Loan System";
        String htmlBody = """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0056b3;">New Task Assignment 📋</h2>
                <p>Hello %s,</p>
                <p>A new %s Application (ID: <b>%s</b>) has been assigned to you for review.</p>
            </div>
            """.formatted(recipientName, type, loanId);

        return new EmailContent(subject, htmlBody);
    }
}