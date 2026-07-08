package bank.loan.gateway_service.config;

import bank.loan.gateway_service.filter.AuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

    @Value("${internal.shared-secret}")
    private String internalSecret;

    private final AuthenticationFilter authenticationFilter;

    public GatewayRoutesConfig(AuthenticationFilter authenticationFilter) {
        this.authenticationFilter = authenticationFilter;
    }

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
        return builder.routes()

            .route("account-service", r -> r
                .path("/account/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://account-service"))

            .route("credit-service", r -> r
                .path("/credit/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://credit-service"))

            .route("oauth-public", r -> r
                .path("/oauth/login", "/oauth/refresh")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://oauth-service"))

            .route("workflow-service", r -> r
                .path("/workflow/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                    .addRequestHeader("X-Internal-Secret", internalSecret))
                .uri("lb://workflow-service"))

            .build();
    }
}