package bank.loan.oauth_service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import bank.loan.oauth_service.service.AuthService;

@RestController
public class OauthController {

    private final AuthService authService;

    public OauthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.TokenResponse> login(@RequestBody LoginRequest request) {
        try {
            Long userId = authService.authenticate(request.email(), request.password());
            return ResponseEntity.ok(authService.issueTokens(userId));
        } catch (HttpClientErrorException.Unauthorized ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthService.TokenResponse(null, null, "Bearer", 0L, 0L));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody TokenRequest request) {
        if (!authService.isTokenValid(request.token())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ValidationResponse("FAILED", "Invalid token", null));
        }

        Long userId = authService.extractUserIdFromToken(request.token());
        return ResponseEntity.ok(new ValidationResponse("SUCCESS", "Token is valid", userId));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthService.TokenResponse> refresh(@RequestBody TokenRequest request) {
        if (!authService.isTokenValid(request.token())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthService.TokenResponse(null, null, "Bearer", 0L, 0L));
        }

        Long userId = authService.extractUserIdFromToken(request.token());
        return ResponseEntity.ok(authService.issueTokens(userId));
    }

    private record LoginRequest(String email, String password) {
    }

    private record TokenRequest(String token) {
    }

    private record ValidationResponse(String status, String message, Long userId) {
    }
}