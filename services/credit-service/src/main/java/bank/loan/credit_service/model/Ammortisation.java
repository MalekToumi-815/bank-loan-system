package bank.loan.credit_service.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class Ammortisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;  

    Date startDate;
    Date endDate;

    int numberofInstalments;

    public Ammortisation() {
    }

    public Ammortisation(Loan loan, Date startDate, Date endDate, int numberofInstalments) {
        this.loan = loan;
        this.startDate = startDate;
        this.endDate = endDate;
        this.numberofInstalments = numberofInstalments;

        if (loan != null)
            loan.setAmmortisation(this);
    }

    public Long getId() {
        return id;
    }

    public Loan getLoan() {
        return loan;
    }

    public void setLoan(Loan loan) {
        this.loan = loan;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public int getNumberofInstalments() {
        return numberofInstalments;
    }

    public void setNumberofInstalments(int numberofInstalments) {
        this.numberofInstalments = numberofInstalments;
    }
}
