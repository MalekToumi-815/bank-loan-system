package bank.loan.account_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.account_service.dto.AuthResponse;
import bank.loan.account_service.dto.UserResponse;
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
	public ResponseEntity<java.util.Map<String, String>> createUser(@RequestBody User user) {
		return userService.createUserResponse(user);
	}

	@GetMapping
	public java.util.List<UserResponse> getAllUsers() {
		return userService.getAllUsers();
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
		return userService.getUserByIdResponse(id);
	}

	@PutMapping("/{id}")
	public ResponseEntity<java.util.Map<String, String>> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
		return userService.updateUserResponse(id, updatedUser);
	}

	@PostMapping("/authenticate")
	public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest authRequest) {
		return userService.authenticateResponse(authRequest.email(), authRequest.password());
	}

	@PostMapping("/{id}/change-password")
	public ResponseEntity<java.util.Map<String, String>> changePassword(@PathVariable Long id,
			@RequestBody ChangePasswordRequest request) {
		return userService.changePasswordResponse(id, request.oldPassword(), request.newPassword());
	}

	private record AuthRequest(String email, String password) {
	}

	private record ChangePasswordRequest(String oldPassword, String newPassword) {
	}

}
