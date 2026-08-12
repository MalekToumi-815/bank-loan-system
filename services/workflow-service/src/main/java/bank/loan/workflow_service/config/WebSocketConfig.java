package bank.loan.workflow_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. Enables an in-memory message broker for routing messages to destinations prefixed with /queue or /topic
        config.enableSimpleBroker("/queue", "/topic");

        // 2. Defines the prefix for messages bound from the client to server-side methods (@MessageMapping)
        config.setApplicationDestinationPrefixes("/app");

        // 3. Defines the prefix used by convertAndSendToUser to route private messages to a specific user
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 4. Registers the connection endpoint that your Angular client (via the Gateway) will target
        registry.addEndpoint("workflow/ws-workflow")
                .setAllowedOriginPatterns("*"); // Adjust for production CORS policies
    }
}