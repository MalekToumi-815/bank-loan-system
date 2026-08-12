package bank.loan.workflow_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import bank.loan.workflow_service.dto.NotificationDTO;

@Service
public class NotificationService {
    
    private final RestClient creditClient;
    private final String internalSecret;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(RestClient.Builder restClientBuilder, @Value("${internal.shared-secret}") String internalSecret, SimpMessagingTemplate messagingTemplate) {
        this.creditClient = restClientBuilder
                .baseUrl("http://credit-service")
                .build();
        this.internalSecret = internalSecret;
        this.messagingTemplate = messagingTemplate;
    }

    private NotificationDTO sendNotification(Long userId, Long loanId, String message) {
        InternalNotificationRequest request = new InternalNotificationRequest(userId, loanId, message);

        return creditClient.post()
                .uri("/notifications")
                .header("X-Internal-Secret", internalSecret)
                .body(request)
                .retrieve()
                .body(NotificationDTO.class);
    }

    private record InternalNotificationRequest(
            Long userId,
            Long loanId,
            String message
    ) {}

    public void processNotification(Long userId, Long loanId, String message) {
        
        NotificationDTO notif = sendNotification(userId, loanId, message);

        // 2. Push real-time event to the user's personal WebSocket queue
        // This targets /user/{userId}/queue/notifications automatically
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId),
                "/queue/notifications",
                notif
        );
    }
}
