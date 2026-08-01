package bank.loan.credit_service.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false, unique = true)
    private Loan loan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskScore riskScore;

    @Column(length = 500)
    private String recommendation;

    @Temporal(TemporalType.TIMESTAMP)
    private Date assessmentDate;

    public RiskAssessment() {
    }

    public RiskAssessment(Loan loan, RiskScore riskScore, String recommendation) {
        this.loan = loan;
        this.riskScore = riskScore;
        this.recommendation = recommendation;
        this.assessmentDate = new Date();

        if (loan != null) {
            loan.setRiskAssessment(this);
        }
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

    public RiskScore getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(RiskScore riskScore) {
        this.riskScore = riskScore;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public Date getAssessmentDate() {
        return assessmentDate;
    }

    public void setAssessmentDate(Date assessmentDate) {
        this.assessmentDate = assessmentDate;
    }
}
