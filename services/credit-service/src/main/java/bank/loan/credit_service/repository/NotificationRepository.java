package bank.loan.credit_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import bank.loan.credit_service.model.Notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId " +
           "AND (:loanId IS NULL OR n.loan.id = :loanId) " +
           "AND (:read IS NULL OR n.read = :read)")
    Page<Notification> findByCriteria(Long userId, Long loanId, Boolean read, Pageable pageable);
}