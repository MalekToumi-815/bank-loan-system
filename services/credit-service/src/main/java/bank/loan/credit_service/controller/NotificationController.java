package bank.loan.credit_service.controller;

import bank.loan.credit_service.dto.loan.NotificationDTO;
import bank.loan.credit_service.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    /**
     * Fetches paginated notifications for the currently authenticated user.
     * Example: GET /notifications?read=false&page=0&size=10&sort=timestamp,desc
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Long loanId,
            @RequestParam(required = false) Boolean read,
            Pageable pageable) {
        
        Page<NotificationDTO> notifications = notificationService.getNotifications(userId, loanId, read, pageable);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Marks a specific notification as read.
     * Example: PUT /notifications/5/read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        
        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Marks all notifications for the authenticated user as read in bulk.
     * Example: PUT /notifications/read-all
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Long userId) {
        
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes a specific notification.
     * Example: DELETE /notifications/5
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(@RequestBody InternalNotificationRequest request) {
        
        NotificationDTO notif = notificationService.createNotification(request.userId(), request.loanId(), request.message());
        return ResponseEntity.ok(notif);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadNotificationCount(@AuthenticationPrincipal Long userId) {
        
        long count = notificationService.getUnreadNotificationCount(userId);
        return ResponseEntity.ok(count);
    }
    
    public record InternalNotificationRequest(
            Long userId, 
            Long loanId, 
            String message
    ) {}
}