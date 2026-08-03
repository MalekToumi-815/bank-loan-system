package bank.loan.credit_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import bank.loan.credit_service.model.Installement;

public interface InstallementRepository extends JpaRepository<Installement, Long> {
}

