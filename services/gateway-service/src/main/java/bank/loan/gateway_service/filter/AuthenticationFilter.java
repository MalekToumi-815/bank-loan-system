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

import java.util.List;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {
    
    @Value("${internal.shared-secret}")
    private String internalSecret;

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    private final WebClient webClient;

    private static final List<String> PUBLIC_POST_ENDPOINTS = List.of(
            "/users",
            "/forgot-password",
            "/reset-password"
    );

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
            String method = exchange.getRequest().getMethod().name();

            log.info("Incoming request: {} {}", method, path);

            // Allow registration without JWT
            if (method.equals("POST") && PUBLIC_POST_ENDPOINTS.contains(path)) {
                log.info("Skipping authentication for public endpoint: {}", path);
                return chain.filter(exchange);
            }

            // --- WEB-SOCKET AWARE TOKEN EXTRACTION ---
            String token = null;
            boolean isWebSocketHandshake = false;
            String wsProtocolToKeep = "v10.stomp"; // Default fallback

            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // 1. Standard HTTP Request
                token = authHeader.substring(7);
            } else {
                // 2. WebSocket Handshake Request (Token is in Sec-WebSocket-Protocol)
                String wsProtocolHeader = exchange.getRequest().getHeaders().getFirst("Sec-WebSocket-Protocol");
                if (wsProtocolHeader != null && wsProtocolHeader.contains(",")) {
                    String[] protocols = wsProtocolHeader.split(",");
                    wsProtocolToKeep = protocols[0].trim(); // Usually "v10.stomp"
                    token = protocols[1].trim();            // The JWT token
                    isWebSocketHandshake = true;
                }
            }

            if (token == null) {
                log.warn("Missing or invalid token in Authorization or Sec-WebSocket-Protocol header");
                return unauthorized(exchange);
            }

            log.debug("Sending token validation request to oauth-service");

            // We need these variables to be effectively final for the reactive pipeline
            final boolean finalIsWebSocket = isWebSocketHandshake;
            final String finalWsProtocol = wsProtocolToKeep;

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

                        log.info("Authenticated user : {}", response.userId());

                        // --- INJECT HEADERS (Works for both HTTP and WebSockets) ---
                        ServerHttpRequest request = exchange.getRequest()
                                .mutate()
                                .headers(headers -> {
                                    headers.remove("X-User-Id");
                                    headers.add("X-User-Id", response.userId().toString());
                                    headers.remove("X-Role");
                                    headers.add("X-Role", response.role());
                                    headers.remove("X-Permissions");
                                    headers.add("X-Permissions", String.join(",", response.permissions()));
                                })
                                .build();

                        log.debug("Injected User headers");

                        // --- CLEAN RESPONSE FOR WEBSOCKETS (CRITICAL) ---
                        if (finalIsWebSocket) {
                            exchange.getResponse().beforeCommit(() -> {
                                log.debug("Cleaning Sec-WebSocket-Protocol response header for STOMP client");
                                exchange.getResponse().getHeaders().set("Sec-WebSocket-Protocol", finalWsProtocol);
                                return Mono.empty();
                            });
                        }

                        return chain.filter(exchange.mutate().request(request).build());
                    })
                    .onErrorResume(exception -> {
                        log.error("Failed to validate token with oauth-service", exception);
                        return unauthorized(exchange);
                    });
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        log.warn("Returning 401 Unauthorized");
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config {}
    
}