package com.notification.notification_service.template;

import java.util.Map;

import com.notification.notification_service.model.NotificationType;

public interface EmailTemplateStrategy {
    
    // Which enum type does this strategy handle?
    NotificationType getSupportedType();

    // Returns a wrapper object containing the dynamic subject and HTML body
    EmailContent buildEmail(Map<String, String> variables, String frontendUrl);

    record EmailContent(String subject, String htmlBody) {}
}
