package bank.loan.oauth_service.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class AuthService {

    private final RestClient restClient;
    private final JwtService jwtService;
    private final String accountServiceName = "account-service";
    private final String internalSecret;

    public AuthService(RestClient.Builder restClientBuilder,
                       JwtService jwtService,
                       @Value("${internal.shared-secret}") String internalSecret) {
        this.restClient = restClientBuilder.build();
        this.jwtService = jwtService;
        this.internalSecret = internalSecret;
    }

    public Map<String, String> issueTokens(Long userId) {
        return Map.of(
                "accessToken", jwtService.generateAccessToken(userId),
                "refreshToken", jwtService.generateRefreshToken(userId)
        );
    }

    public Long authenticate(String email, String password) {
        AccountAuthRequest request = new AccountAuthRequest(email, password);
        AccountAuthResponse response = restClient.post()
                .uri("http://" + accountServiceName + "/users/authenticate")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Internal-Secret", internalSecret)
                .body(request)
                .retrieve()
                .body(AccountAuthResponse.class);

        if (response == null || response.userId() == null || response.status() == null || !"SUCCESS".equals(response.status())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return response.userId();
    }

    public Long extractUserIdFromToken(String token) {
        return jwtService.extractUserId(token);
    }

    public boolean isTokenValid(String token) {
        return jwtService.isTokenValid(token);
    }

    private record AccountAuthRequest(String email, String password) {
    }

    private record AccountAuthResponse(String status, String message, Long userId) {
    }
}
