package bank.loan.account_service.service;

public interface PasswordResetNotifier {
    void sendResetLink(String email, String token);
}