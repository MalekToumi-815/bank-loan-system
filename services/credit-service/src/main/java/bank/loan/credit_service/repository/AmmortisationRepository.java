package bank.loan.credit_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import bank.loan.credit_service.model.Ammortisation;

public interface AmmortisationRepository extends JpaRepository<Ammortisation, Long> {}
