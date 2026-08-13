package com.notification.notification_service.service;

import com.notification.notification_service.config.RabbitMQConfig;
import com.notification.notification_service.model.EmailRequest;
import com.notification.notification_service.model.NotificationType;
import com.notification.notification_service.template.EmailTemplateStrategy;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EmailConsumerService {

    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final Map<NotificationType, EmailTemplateStrategy> strategies;

    // Spring automatically injects all template strategies and maps them by their type
    public EmailConsumerService(
            JavaMailSender mailSender,
            @Value("${app.frontend-url:http://localhost:4200}") String frontendUrl,
            java.util.List<EmailTemplateStrategy> strategyList) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(EmailTemplateStrategy::getSupportedType, Function.identity()));
    }

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void consumeEmailRequest(EmailRequest request) {
        EmailTemplateStrategy strategy = strategies.get(request.type());
        
        if (strategy == null) {
            throw new IllegalArgumentException("No email template strategy found for type: " + request.type());
        }

        // Build the dynamic subject and HTML content using the strategy
        EmailTemplateStrategy.EmailContent content = strategy.buildEmail(
                request.variables(), 
                frontendUrl
        );

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("noreply@bankloan.com");
            helper.setTo(request.to());
            helper.setSubject(content.subject());
            helper.setText(content.htmlBody(), true);

            mailSender.send(message);
            System.out.println("HTML Email sent successfully for type: " + request.type());

        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + request.to() + ": " + e.getMessage());
            throw new RuntimeException(e);
        }
    }
}