package bank.loan.credit_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.credit_service.dto.LoanRequest;
import bank.loan.credit_service.model.LoanStatus;
import bank.loan.credit_service.service.LoanService;

@RestController
@RequestMapping("/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createLoan(
            @RequestBody LoanRequest loanRequest,
            @RequestHeader("X-User-Id") Long clientId) {
        return loanService.createLoanResponse(loanRequest, clientId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanRequest> getLoanById(@PathVariable Long id) {
        return loanService.getLoanByIdResponse(id);
    }

    @GetMapping
    public ResponseEntity<List<LoanRequest>> getAllLoans() {
        return loanService.getAllLoansResponse();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updateLoanStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        LoanStatus status = LoanStatus.valueOf(payload.get("status"));
        return loanService.updateLoanStatusResponse(id, status);
    }
}
