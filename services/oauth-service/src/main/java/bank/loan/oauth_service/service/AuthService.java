package bank.loan.oauth_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;

import bank.loan.oauth_service.dto.ValidationResponse;

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

    public TokenResponse issueTokens(Long userId) {
        return new TokenResponse(
                jwtService.generateAccessToken(userId),
                jwtService.generateRefreshToken(userId),
                "Bearer",
                jwtService.getAccessTokenExpiresInSeconds(),
                jwtService.getRefreshTokenExpiresInSeconds()
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

    public ResponseEntity<TokenResponse> loginResponse(String email, String password) {
        try {
            Long userId = authenticate(email, password);
            return ResponseEntity.ok(issueTokens(userId));
        } catch (HttpClientErrorException.Unauthorized ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    public ResponseEntity<ValidationResponse> validateResponse(String token) {
        if (!isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = extractUserIdFromToken(token);
        return ResponseEntity.ok(new ValidationResponse("SUCCESS", "Token is valid", userId));
    }

    public ResponseEntity<TokenResponse> refreshResponse(String token) {
        if (!isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = extractUserIdFromToken(token);
        return ResponseEntity.ok(issueTokens(userId));
    }

    public record TokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long accessTokenExpiresIn,
            long refreshTokenExpiresIn) {
    }

    private record AccountAuthRequest(String email, String password) {
    }

    private record AccountAuthResponse(String status, String message, Long userId) {
    }
}
