package bank.loan.oauth_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.oauth_service.dto.ValidationResponse;
import bank.loan.oauth_service.service.AuthService;

@RestController
public class OauthController {

    private final AuthService authService;

    public OauthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.TokenResponse> login(@RequestBody LoginRequest request) {
        return authService.loginResponse(request.email(), request.password());
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody TokenRequest request) {
        return authService.validateResponse(request.token());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthService.TokenResponse> refresh(@RequestBody TokenRequest request) {
        return authService.refreshResponse(request.token());
    }

    private record LoginRequest(String email, String password) {
    }

    private record TokenRequest(String token) {
    }

}