package bank.loan.account_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.account_service.model.User;
import bank.loan.account_service.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping
	public ResponseEntity<Map<String, String>> createUser(@RequestBody User user) {
		try {
			userService.createUser(user);
			return ResponseEntity.status(HttpStatus.CREATED).body(statusBody("SUCCESS", "User created"));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(statusBody("FAILED", ex.getMessage()));
		}
	}

	@GetMapping
	public List<UserResponse> getAllUsers() {
		return userService.getAllUsers().stream().map(this::toResponse).toList();
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
		return userService.getUserById(id)
				.map(user -> ResponseEntity.ok(toResponse(user)))
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PutMapping("/{id}")
	public ResponseEntity<Map<String, String>> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
		try {
			return userService.updateUser(id, updatedUser)
					.map(user -> ResponseEntity.ok(statusBody("SUCCESS", "User updated")))
					.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
							.body(statusBody("FAILED", "User not found")));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.status(HttpStatus.CONFLICT).body(statusBody("FAILED", ex.getMessage()));
		}
	}

	@PostMapping("/authenticate")
	public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest authRequest) {
		return userService.authenticate(authRequest.email(), authRequest.password())
				.map(user -> ResponseEntity.ok(new AuthResponse("SUCCESS", "Authentication successful", user.getId())))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body(new AuthResponse("FAILED", "Invalid credentials", null)));
	}

	@PostMapping("/{id}/change-password")
	public ResponseEntity<Map<String, String>> changePassword(@PathVariable Long id,
			@RequestBody ChangePasswordRequest request) {
		boolean changed = userService.changePassword(id, request.oldPassword(), request.newPassword());
		if (!changed) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(statusBody("FAILED", "Invalid user ID or password"));
		}
		return ResponseEntity.ok(statusBody("SUCCESS", "Password changed successfully"));
	}

	private Map<String, String> statusBody(String status, String message) {
		return Map.of("status", status, "message", message);
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

	private record AuthRequest(String email, String password) {
	}

	private record ChangePasswordRequest(String oldPassword, String newPassword) {
	}

	private record AuthResponse(String status, String message, Long userId) {
	}

	private record UserResponse(Long id, String name, String surname, String cin, String phone, String email) {
	}
}
