package bank.loan.credit_service.dto.task;

import bank.loan.credit_service.model.LoanStatus;

public record ReceptionistTask(float interestRate,LoanStatus status) {
    //TODO: Add uploaded Documents 
}
