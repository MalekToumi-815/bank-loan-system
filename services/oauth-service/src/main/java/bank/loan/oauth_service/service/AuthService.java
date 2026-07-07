package bank.loan.oauth_service.service;

import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final JwtService jwtService;

    public AuthService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public Map<String, String> issueTokens(Long userId) {
        return Map.of(
                "accessToken", jwtService.generateAccessToken(userId),
                "refreshToken", jwtService.generateRefreshToken(userId)
        );
    }

    public Long extractUserIdFromToken(String token) {
        return jwtService.extractUserId(token);
    }

    public boolean isTokenValid(String token) {
        return jwtService.isTokenValid(token);
    }
}
