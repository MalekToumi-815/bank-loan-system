package bank.loan.workflow_service.dto;

import bank.loan.workflow_service.model.LoanStatus;

public record ReceptionistTask(float interestRate,LoanStatus status) {
    //TODO: Add uploaded Documents 
}
