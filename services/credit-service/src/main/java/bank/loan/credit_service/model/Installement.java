package bank.loan.credit_service.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class Installement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ammortisation_id", nullable = false)
    private Ammortisation ammortisation;

    private Date dueDate;
    private float amount;
    private InstallementStatus status;

    public Installement() {
    }

    public Installement(Ammortisation ammortisation, Date dueDate, float amount) {
        this.ammortisation = ammortisation;
        this.dueDate = dueDate;
        this.amount = amount;
        this.status = InstallementStatus.PENDING; // default to pending
    }

    public Long getId() {
        return id;
    }

    public Ammortisation getAmmortisation() {
        return ammortisation;
    }

    public Date getDueDate() {
        return dueDate;
    }

    public float getAmount() {
        return amount;
    }

    public InstallementStatus getStatus() {
        return status;
    }

    public void setStatus(InstallementStatus status) {
        this.status = status;
    }
}