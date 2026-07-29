package bank.loan.account_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.account_service.dto.AuthResponse;
import bank.loan.account_service.dto.UserResponse;
import bank.loan.account_service.model.User;
import bank.loan.account_service.service.UserService;
import bank.loan.account_service.model.Role;
import bank.loan.account_service.model.Status;

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

	@PreAuthorize("hasAuthority('MANAGE-USERS') || hasRole('INTERNAL')")
	@GetMapping
	public java.util.List<UserResponse> getAllUsers(
			@RequestParam(required = false) Role role,
			@RequestParam(required = false) Status status) {
		return userService.getAllUsers(role, status);
	}

	@PreAuthorize("hasAuthority('MANAGE-USERS') || authentication.principal == #id || hasRole('INTERNAL')")
	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
		return userService.getUserByIdResponse(id);
	}

	@PreAuthorize("hasAuthority('MANAGE-USERS') || authentication.principal == #id || hasRole('INTERNAL')")
	@PutMapping("/{id}")
	public ResponseEntity<java.util.Map<String, String>> updateUser(
			@PathVariable Long id,
			@RequestHeader("X-User-Id") Long userId,
			@RequestBody User updatedUser) {

		return userService.updateUserResponse(id, userId, updatedUser);
	}

	@PreAuthorize("hasAuthority('MANAGE-USERS') || authentication.principal == #id || hasRole('INTERNAL')")
	@PostMapping("/authenticate")
	public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest authRequest) {
		return userService.authenticateResponse(authRequest.email());
	}

	@PreAuthorize("hasAuthority('MANAGE-USERS') || authentication.principal == #id || hasRole('INTERNAL')")
	@PostMapping("/{id}/change-password")
	public ResponseEntity<java.util.Map<String, String>> changePassword(@PathVariable Long id,
		@RequestHeader("X-User-Id") Long userId,	
		@RequestBody ChangePasswordRequest request) {
		return userService.changePasswordResponse(id, userId, request.oldPassword(), request.newPassword());
	}

	@PreAuthorize("hasAuthority('MANAGE-USERS')")
	@DeleteMapping("/{id}")
	public ResponseEntity<java.util.Map<String, String>> deleteUser(@PathVariable Long id) {
		return userService.deleteUserResponse(id);
	}

	@PreAuthorize("hasRole('INTERNAL')")
	@PutMapping("/{id}/reset-password")
	public ResponseEntity<java.util.Map<String, String>> resetPassword(
			@PathVariable Long id,
			@RequestBody ResetPasswordRequest request) {
		return userService.resetPasswordResponse(id, request.encryptedPassword());
	}

	private record AuthRequest(String email) {
	}

	private record ResetPasswordRequest(String encryptedPassword) {
	}

	private record ChangePasswordRequest(String oldPassword, String newPassword) {
	}

}
