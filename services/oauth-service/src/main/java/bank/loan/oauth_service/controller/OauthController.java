package bank.loan.oauth_service.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.oauth_service.service.AuthService;

@RestController
public class OauthController {

    private final AuthService authService;

    public OauthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Long userId = authService.authenticate(request.email(), request.password());
            return ResponseEntity.ok(authService.issueTokens(userId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "FAILED", "message", "Invalid credentials"));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody TokenRequest request) {
        if (!authService.isTokenValid(request.token())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "FAILED", "message", "Invalid token"));
        }

        Long userId = authService.extractUserIdFromToken(request.token());
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Token is valid",
                "userId", userId
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody TokenRequest request) {
        if (!authService.isTokenValid(request.token())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "FAILED", "message", "Invalid refresh token"));
        }

        Long userId = authService.extractUserIdFromToken(request.token());
        return ResponseEntity.ok(authService.issueTokens(userId));
    }

    private record LoginRequest(String email, String password) {
    }

    private record TokenRequest(String token) {
    }
}