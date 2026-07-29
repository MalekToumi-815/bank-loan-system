package bank.loan.oauth_service.service;

public interface PasswordResetNotifier {
    void sendResetLink(String email, String token);
}