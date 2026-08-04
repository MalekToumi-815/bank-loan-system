package bank.loan.credit_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import bank.loan.credit_service.model.Installement;
import bank.loan.credit_service.model.InstallementStatus;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Date;

public interface InstallementRepository extends JpaRepository<Installement, Long> {

    @Modifying
    @Query("UPDATE Installement i SET i.status = :newStatus WHERE i.status = :oldStatus AND i.dueDate < :currentDate")
    int updateStatusForPassedDueDates(
            @Param("oldStatus") InstallementStatus oldStatus,
            @Param("newStatus") InstallementStatus newStatus,
            @Param("currentDate") Date currentDate
    );
}