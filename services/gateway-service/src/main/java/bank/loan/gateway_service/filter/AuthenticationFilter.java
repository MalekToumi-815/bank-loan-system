package bank.loan.gateway_service.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;

import bank.loan.gateway_service.dto.TokenRequest;
import bank.loan.gateway_service.dto.ValidationResponse;

import reactor.core.publisher.Mono;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {
    @Value("${internal.shared-secret}")
    private String internalSecret;
    
    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    private final WebClient webClient;

    public AuthenticationFilter(WebClient.Builder builder) {
        super(Config.class);

        this.webClient = builder
                .baseUrl("http://oauth-service")
                .build();

        log.info("AuthenticationFilter initialized");
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            String path = exchange.getRequest().getPath().value();
            String method = exchange.getRequest()
                    .getMethod()
                    .name();

            log.info("Incoming request: {} {}", method, path);

            // Allow registration without JWT
            if (method.equals("POST") && path.equals("/users")) {
                log.info("Skipping authentication for user registration");
                return chain.filter(exchange);
            }

            String authHeader = exchange.getRequest()
                    .getHeaders()
                    .getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing or invalid Authorization header");
                return unauthorized(exchange);
            }

            String token = authHeader.substring(7);

            log.debug("Sending token validation request to oauth-service");

            return webClient.post()
                    .uri("/validate")
                    .header("X-Internal-Secret", internalSecret)
                    .bodyValue(new TokenRequest(token))
                    .retrieve()
                    .bodyToMono(ValidationResponse.class)
                    .flatMap(response -> {

                        log.info("Token validation response: {}", response);

                        if (response == null || response.userId() == null) {
                            log.warn("Invalid validation response");
                            return unauthorized(exchange);
                        }

                        log.info("Authenticated user id: {}", response.userId());

                        ServerHttpRequest request = exchange.getRequest()
                                .mutate()
                                .headers(headers -> {
                                    headers.remove("X-User-Id");
                                    headers.add(
                                            "X-User-Id",
                                            response.userId().toString()
                                    );
                                })
                                .build();

                        log.debug("Injected X-User-Id header");

                        return chain.filter(
                                exchange.mutate()
                                        .request(request)
                                        .build()
                        );
                    })
                    .onErrorResume(exception -> {
                        log.error("Failed to validate token with oauth-service", exception);
                        return unauthorized(exchange);
                    });
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {

        log.warn("Returning 401 Unauthorized");

        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);

        return exchange.getResponse().setComplete();
    }

    public static class Config {}
}