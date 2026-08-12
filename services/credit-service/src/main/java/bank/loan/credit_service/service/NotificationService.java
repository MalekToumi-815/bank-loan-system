package bank.loan.credit_service.service;

import bank.loan.credit_service.dto.loan.NotificationDTO;
import bank.loan.credit_service.model.Loan;
import bank.loan.credit_service.model.Notification;
import bank.loan.credit_service.repository.LoanRepository;
import bank.loan.credit_service.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException; // 👈 Added this import
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final LoanRepository loanRepository;
    
    // Inject your NotificationMapper here when you are ready to return DTOs
    // private final NotificationMapper notificationMapper;

    public NotificationService(NotificationRepository notificationRepository, LoanRepository loanRepository) {
        this.notificationRepository = notificationRepository;
        this.loanRepository = loanRepository;
    }

    /**
     * Creates a notification and updates the Loan's notification list in memory.
     */
    public NotificationDTO createNotification(Long userId, Long loanId, String message) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new EntityNotFoundException("Loan not found with ID: " + loanId));

        Notification notification = new Notification(userId, loan, message);

        // Synchronize the bidirectional relationship safely
        if (loan.getNotifications() == null) {
            loan.setNotifications(new java.util.ArrayList<>());
        }
        loan.getNotifications().add(notification);

        notificationRepository.save(notification);

        return new NotificationDTO(
                notification.getId(),
                loan.getId(),
                notification.getUserId(),
                notification.getMessage(),
                notification.getTimestamp(),
                notification.isRead()
        );
    }

    /**
     * Fetches notifications securely filtered by the extracted JWT user ID.
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotifications(Long userId, Long loanId, Boolean read, Pageable pageable) {

        return notificationRepository.findByCriteria(userId, loanId, read, pageable)
                .map(notification -> new NotificationDTO(
                        notification.getId(), 
                        notification.getLoan().getId(), 
                        notification.getUserId(),
                        notification.getMessage(),
                        notification.getTimestamp(), 
                        notification.isRead()
                ));
    }

    /**
     * Marks a single notification as read, enforcing user ownership.
     */
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with ID: " + notificationId));

        // Strict security check: prevent users from modifying others' notifications
        if (!notification.getUserId().equals(userId)) {
            // 👈 Changed to Spring Security's AccessDeniedException
            throw new AccessDeniedException("User not authorized to modify this notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Bulk action to mark all of a specific user's notifications as read.
     */
    public void markAllAsRead(Long userId) {
        // Fetches all unread notifications for this user without pagination constraints
        notificationRepository.findByCriteria(userId, null, false, Pageable.unpaged())
                .forEach(notification -> {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                });
    }

    /**
     * Deletes a notification, ensuring it is unlinked from the Loan first.
     */
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with ID: " + notificationId));

        // Strict security check
        if (!notification.getUserId().equals(userId)) {
            // 👈 Changed to Spring Security's AccessDeniedException
            throw new AccessDeniedException("User not authorized to delete this notification");
        }

        // Clean up the bidirectional relationship before deletion to prevent JPA constraint errors
        if (notification.getLoan() != null && notification.getLoan().getNotifications() != null) {
            notification.getLoan().getNotifications().remove(notification);
        }

        notificationRepository.delete(notification);
    }
}