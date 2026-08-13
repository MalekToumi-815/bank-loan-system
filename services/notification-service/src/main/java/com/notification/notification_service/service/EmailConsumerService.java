package com.notification.notification_service.service;

import com.notification.notification_service.config.RabbitMQConfig;
import com.notification.notification_service.model.NotificationType;
import com.notification.notification_service.service.EmailConsumerService.EmailRequest;

import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailConsumerService {

    private final JavaMailSender mailSender;

    public EmailConsumerService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Expected JSON structure mapped automatically by Jackson
    public record EmailRequest(
        String to,                  
        String recipientName,       
        NotificationType type,      
        Map<String, String> variables 
    ) {}

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void consumeEmailRequest(EmailRequest request) {
        System.out.println("Received email request for: " + request.to());
    }
}