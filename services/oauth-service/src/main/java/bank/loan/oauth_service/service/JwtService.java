package bank.loan.oauth_service.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtService(@Value("${jwt.secret}") String jwtSecret,
                      @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
                      @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(Long userId, String role, List<String> permissions) {
        return generateToken(userId, role, permissions, accessTokenExpiration, "ACCESS");
    }

    public String generateRefreshToken(Long userId, String role, List<String> permissions) {
        return generateToken(userId, role, permissions, refreshTokenExpiration, "REFRESH");
    }

    public long getAccessTokenExpiresInSeconds() {
        return accessTokenExpiration / 1000;
    }

    public long getRefreshTokenExpiresInSeconds() {
        return refreshTokenExpiration / 1000;
    }

    public Long extractUserId(String token) {
        return Long.valueOf(getClaims(token).get("userId", Long.class));
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public List<String> extractPermissions(String token) {
        return getClaims(token).get("permissions", List.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.getExpiration() != null && claims.getExpiration().after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    private String generateToken(Long userId, String role, List<String> permissions, long expirationMillis, String type) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMillis);
        List<String> safePermissions = permissions == null ? List.of() : permissions;

        return Jwts.builder()
                .subject("user")
                .claim("userId", userId)
                .claim("role", role)
                .claim("permissions", safePermissions)
                .claim("type", type)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return "REFRESH".equals(claims.get("type", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
