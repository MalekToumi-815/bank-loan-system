package bank.loan.gateway_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;

@Configuration
public class GatewayRoutesConfig {

    @Value("${internal.shared-secret}")
    private String internalSecret;

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("account-service", r -> r
                .path("/account/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://account-service"))

            .route("credit-service", r -> r
                .path("/credit/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://credit-service"))

            .route("oauth-service", r -> r
                .path("/oauth/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://oauth-service"))

            .route("workflow-service", r -> r
                .path("/workflow/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://workflow-service"))

            .build();
    }
}