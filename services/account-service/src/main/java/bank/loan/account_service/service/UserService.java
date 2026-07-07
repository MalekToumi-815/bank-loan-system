package bank.loan.account_service.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import bank.loan.account_service.model.User;
import bank.loan.account_service.repository.UserRepository;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	public User createUser(User user) {
		validateEmailAvailability(user.getEmail(), null);
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		return userRepository.save(user);
	}

	public List<User> getAllUsers() {
		return userRepository.findAll();
	}

	public Optional<User> getUserById(Long id) {
		return userRepository.findById(id);
	}

	public Optional<User> getUserByEmail(String email) {
		return userRepository.findByEmail(email);
	}

	public Optional<User> updateUser(Long id, User updatedUser) {
		return userRepository.findById(id).map(existingUser -> {

			if (updatedUser.getName() != null) {
				existingUser.setName(updatedUser.getName());
			}
			if (updatedUser.getSurname() != null) {
				existingUser.setSurname(updatedUser.getSurname());
			}
			if (updatedUser.getCin() != null) {
				existingUser.setCin(updatedUser.getCin());
			}
			if (updatedUser.getPhone() != null) {
				existingUser.setPhone(updatedUser.getPhone());
			}

			return userRepository.save(existingUser);
		});
	}

	public Optional<User> authenticate(String email, String rawPassword) {
		return userRepository.findByEmail(email)
				.filter(user -> passwordEncoder.matches(rawPassword, user.getPassword()));
	}

	public boolean changePassword(Long userId, String oldPassword, String newPassword) {
		Optional<User> optionalUser = userRepository.findById(userId);
		if (optionalUser.isEmpty()) {
			return false;
		}

		User user = optionalUser.get();
		if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
			return false;
		}

		user.setPassword(passwordEncoder.encode(newPassword));
		userRepository.save(user);
		return true;
	}

	private void validateEmailAvailability(String email, Long currentUserId) {
		userRepository.findByEmail(email).ifPresent(existing -> {
			if (currentUserId == null || !existing.getId().equals(currentUserId)) {
				throw new IllegalArgumentException("Email already exists");
			}
		});
	}
}
