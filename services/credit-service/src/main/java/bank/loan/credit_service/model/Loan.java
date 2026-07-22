package bank.loan.credit_service.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId; // reference to account-service's User

    private Date submissionDate;

    private float amount;

    @Enumerated(EnumType.STRING)
    private LoanType type;

    private int durationMonths;

    private float interestRate;

    @Enumerated(EnumType.STRING)
    private LoanStatus status;

    private String finalDecision;

    private String workflowProcessInstanceId; // links to Flowable's running instance 

    public Loan(float amount, LoanType type, int durationMonths) {
        this.submissionDate = new Date();
        this.amount = amount;
        this.type = type;
        this.durationMonths = durationMonths;
        this.status = LoanStatus.SUBMITTED; // default status
    }

    public Loan() {
    }

    public Long getId() {
        return id;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public Date getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(Date submissionDate) {
        this.submissionDate = submissionDate;
    }

    public float getAmount() {
        return amount;
    }

    public void setAmount(float amount) {
        this.amount = amount;
    }

    public LoanType getType() {
        return type;
    }

    public void setType(LoanType type) {
        this.type = type;
    }

    public int getDurationMonths() {
        return durationMonths;
    }

    public void setDurationMonths(int durationMonths) {
        this.durationMonths = durationMonths;
    }

    public float getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(float interestRate) {
        this.interestRate = interestRate;
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
    }

    public String getFinalDecision() {
        return finalDecision;
    }

    public void setFinalDecision(String finalDecision) {
        this.finalDecision = finalDecision;
    }

    public String getWorkflowProcessInstanceId() {
        return workflowProcessInstanceId;
    }

    public void setWorkflowProcessInstanceId(String workflowProcessInstanceId) {
        this.workflowProcessInstanceId = workflowProcessInstanceId;
    }
}
