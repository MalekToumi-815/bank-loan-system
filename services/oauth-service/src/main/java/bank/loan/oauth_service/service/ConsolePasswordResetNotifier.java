package bank.loan.oauth_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ConsolePasswordResetNotifier implements PasswordResetNotifier {

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Override
    public void sendResetLink(String email, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        
        System.out.println("==================================================");
        System.out.println("SIMULATED EMAIL TO: " + email);
        System.out.println("Reset Password Link: " + resetLink);
        System.out.println("==================================================");
    }
}