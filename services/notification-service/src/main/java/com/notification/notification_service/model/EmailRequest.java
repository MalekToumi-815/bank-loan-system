package com.notification.notification_service.model;

import java.util.Map;

public record EmailRequest(
        String to,      
        NotificationType type,      
        Map<String, String> variables 
    ) {}