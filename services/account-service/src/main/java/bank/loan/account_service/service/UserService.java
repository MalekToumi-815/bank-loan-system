package bank.loan.account_service.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import bank.loan.account_service.dto.AuthResponse;
import bank.loan.account_service.dto.UserResponse;
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

	public ResponseEntity<java.util.Map<String, String>> createUserResponse(User user) {
		try {
			createUser(user);
			return ResponseEntity.status(HttpStatus.CREATED)
					.body(java.util.Map.of("status", "SUCCESS", "message", "User created"));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
					.body(java.util.Map.of("status", "FAILED", "message", ex.getMessage()));
		}
	}

	public List<UserResponse> getAllUsers() {
		return userRepository.findAll().stream().map(this::toResponse).toList();
	}

	public Optional<UserResponse> getUserById(Long id) {
		return userRepository.findById(id).map(this::toResponse);
	}

	public ResponseEntity<UserResponse> getUserByIdResponse(Long id) {
		return userRepository.findById(id)
				.map(user -> ResponseEntity.ok(toResponse(user)))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
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

	public ResponseEntity<Map<String, String>> updateUserResponse(
	        Long id,
	        Long userId,
	        User updatedUser) {
			
	    try {
	        if (!id.equals(userId)) {
	            return ResponseEntity.status(HttpStatus.FORBIDDEN)
	                    .body(Map.of(
	                            "status", "FAILED",
	                            "message", "You cannot update another user's account"
	                    ));
	        }
		
	        return updateUser(id, updatedUser)
	                .map(user -> ResponseEntity.ok(
	                        Map.of(
	                                "status", "SUCCESS",
	                                "message", "User updated"
	                        )
	                ))
	                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
	                        .body(Map.of(
	                                "status", "FAILED",
	                                "message", "User not found"
	                        )));
						
	    } catch (IllegalArgumentException ex) {
	        return ResponseEntity.status(HttpStatus.CONFLICT)
	                .body(Map.of(
	                        "status", "FAILED",
	                        "message", ex.getMessage()
	                ));
	    }
	}

	public ResponseEntity<AuthResponse> authenticateResponse(String email) {
		return userRepository.findByEmail(email)
				.map(user -> ResponseEntity.ok(new AuthResponse("SUCCESS", "User found", user.getId(), user.getPassword())))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
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

	public ResponseEntity<java.util.Map<String, String>> changePasswordResponse(Long userId, Long id, String oldPassword,
			String newPassword) {
		if (!id.equals(userId)) {
	            return ResponseEntity.status(HttpStatus.FORBIDDEN)
	                    .body(Map.of(
	                            "status", "FAILED",
	                            "message", "You cannot update another user's account"
	                    ));
	        }
		if (!changePassword(userId, oldPassword, newPassword)) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(java.util.Map.of("status", "FAILED", "message", "Invalid user ID or password"));
		}
		return ResponseEntity.ok(java.util.Map.of("status", "SUCCESS", "message", "Password changed successfully"));
	}

	private void validateEmailAvailability(String email, Long currentUserId) {
		userRepository.findByEmail(email).ifPresent(existing -> {
			if (currentUserId == null || !existing.getId().equals(currentUserId)) {
				throw new IllegalArgumentException("Email already exists");
			}
		});
	}

	private UserResponse toResponse(User user) {
		return new UserResponse(
				user.getId(),
				user.getName(),
				user.getSurname(),
				user.getCin(),
				user.getPhone(),
				user.getEmail());
	}
}
