package bank.loan.account_service.config;

import bank.loan.account_service.model.Role;
import bank.loan.account_service.model.Status;
import bank.loan.account_service.model.User;
import bank.loan.account_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@bank.com").isEmpty()) {
            User admin = new User(
                    "Admin",
                    "System",
                    "ADMIN-CIN-000",
                    "+00000000000",
                    "admin@bank.com",
                    passwordEncoder.encode("admin123"),
                    Role.BANK_ADMIN,
                    Status.ACTIVE);

            userRepository.save(admin);
            System.out.println(">>> Default BANK_ADMIN user initialized successfully.");
        }
    }
}
