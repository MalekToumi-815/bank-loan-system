package bank.loan.credit_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.credit_service.dto.loan.LoanRequest;
import bank.loan.credit_service.dto.loan.LoanResponse;
import bank.loan.credit_service.dto.task.AdminTask;
import bank.loan.credit_service.dto.task.ReceptionistTask;
import bank.loan.credit_service.model.LoanStatus;
import bank.loan.credit_service.service.LoanService;

@RestController
@RequestMapping("/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createLoan(
            @RequestBody LoanRequest loanRequest,
            @RequestParam("clientId") Long clientId) {
        return loanService.createLoanResponse(loanRequest, clientId);
    }

    @PreAuthorize("hasRole('INTERNAL') || hasAuthority('MANAGE-LOANS') || hasAuthority('VIEW-LOAN')")
    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getLoanById(@PathVariable Long id) {
        return loanService.getLoanByIdResponse(id);
    }

    @PreAuthorize("hasRole('INTERNAL') || hasAuthority('MANAGE-LOANS') || hasAuthority('VIEW-LOAN')")
    @GetMapping
    public ResponseEntity<List<LoanResponse>> getAllLoans(@RequestParam(required = false) Long clientId) {
        return loanService.getAllLoansResponse(clientId);
    }

    @PreAuthorize("hasRole('INTERNAL') || hasAuthority('MANAGE-LOANS')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteLoan(@PathVariable Long id) {
        return loanService.deleteLoanResponse(id);
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updateLoanStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        LoanStatus status = LoanStatus.valueOf(payload.get("status"));
        return loanService.updateLoanStatusResponse(id, status);
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PutMapping("/{id}/process-instance-id")
    public ResponseEntity<Map<String, String>> updateProcessInstanceid(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String processInstanceId = payload.get("processInstanceId");
        return loanService.updateProcessInstanceidResponse(id, processInstanceId);
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PutMapping("/{id}/receptionist-task")
    public ResponseEntity<Map<String, String>> updateReceptionistTask(
            @PathVariable Long id,
            @RequestBody ReceptionistTask task) {
        return loanService.updateReceptionistTaskResponse(id, task);
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PutMapping("/{id}/admin-task")
    public ResponseEntity<Map<String, String>> updateAdminTask(
            @PathVariable Long id,
            @RequestBody AdminTask task) {
        return loanService.updateAdminTaskResponse(id, task);
    }
    @PreAuthorize("hasRole('INTERNAL')")
    @PostMapping("/{id}/risk")
    public ResponseEntity<Map<String, Object>> createRiskAssessment(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        return loanService.createRiskAssessmentResponse(id, payload);
    }

    @PreAuthorize("hasAuthority('VIEW-LOAN')")
    @GetMapping("/{id}/risk")
    public ResponseEntity<Map<String, Object>> getRiskAssessmentByLoanId(@PathVariable Long id) {
        return loanService.getRiskAssessmentByLoanIdResponse(id);
    }

    @PreAuthorize("hasRole('INTERNAL')")
    @PostMapping("/{id}/ammortisation")
    public ResponseEntity<Map<String, String>> createAmmortisation(@PathVariable Long id) {
        return loanService.createAmmortisationResponse(id);
    }

    @PreAuthorize("hasAuthority('VIEW-LOAN')")
    @GetMapping("/{id}/ammortisation")
    public ResponseEntity<Map<String, Object>> getAmmortisationByLoanId(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page) {
        return loanService.getInstallementsByLoanIdResponse(id, page);
    }

    @PreAuthorize("hasAuthority('VIEW-LOAN')")
    @PostMapping("/{id}/pay-installement")
    public ResponseEntity<Map<String, String>> payInstallement(@PathVariable Long installementId) {
        return loanService.payInstallement(installementId);
    }
}
