package bank.loan.credit_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.credit_service.dto.stats.AdminStatsResponse;
import bank.loan.credit_service.dto.stats.OfficerStatsResponse;
import bank.loan.credit_service.dto.stats.ReceptionistStatsResponse;
import bank.loan.credit_service.service.LoanStatsService;

@RestController
@RequestMapping("/stats")
public class LoanStatsController {

    private final LoanStatsService loanStatsService;

    public LoanStatsController(LoanStatsService loanStatsService) {
        this.loanStatsService = loanStatsService;
    }

    @PreAuthorize("hasRole('INTERNAL') || hasAuthority('VIEW-LOAN') || hasAuthority('MANAGE-LOANS')")
    @GetMapping("/receptionist")
    public ResponseEntity<ReceptionistStatsResponse> getReceptionistStats(
            @RequestParam(required = false) Long receptionistId) {
        return loanStatsService.getReceptionistStatsResponse(receptionistId);
    }

    @PreAuthorize("hasRole('INTERNAL') || hasAuthority('VIEW-LOAN') || hasAuthority('MANAGE-LOANS')")
    @GetMapping("/officer")
    public ResponseEntity<OfficerStatsResponse> getOfficerStats(
            @RequestParam(required = false) Long officerId) {
        return loanStatsService.getOfficerStatsResponse(officerId);
    }

    @PreAuthorize("hasRole('INTERNAL') || hasAuthority('MANAGE-LOANS')")
    @GetMapping("/admin")
    public ResponseEntity<AdminStatsResponse> getAdminStats() {
        return loanStatsService.getAdminStatsResponse();
    }
}
