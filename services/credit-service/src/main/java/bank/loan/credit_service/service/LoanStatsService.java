package bank.loan.credit_service.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import bank.loan.credit_service.dto.stats.AdminStatsResponse;
import bank.loan.credit_service.dto.stats.AdminStatsResponse.AdminPortfolioSummaryDto;
import bank.loan.credit_service.dto.stats.AdminStatsResponse.PipelineStageDto;
import bank.loan.credit_service.dto.stats.AdminStatsResponse.PortfolioByTypeDto;
import bank.loan.credit_service.dto.stats.OfficerStatsResponse;
import bank.loan.credit_service.dto.stats.OfficerStatsResponse.OfficerQueueSplitDto;
import bank.loan.credit_service.dto.stats.OfficerStatsResponse.RiskDistributionDto;
import bank.loan.credit_service.dto.stats.ReceptionistStatsResponse;
import bank.loan.credit_service.dto.stats.ReceptionistStatsResponse.LoanTypeAggregateDto;
import bank.loan.credit_service.dto.stats.StatsProjections.AdminPortfolioProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.LoanTypeCountProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.PipelineStageProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.PortfolioByTypeProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.RiskScoreDistributionProjection;
import bank.loan.credit_service.dto.stats.StatsProjections.TaskTurnaroundProjection;
import bank.loan.credit_service.model.Role;
import bank.loan.credit_service.repository.LoanRepository;
import bank.loan.credit_service.repository.RiskAssessmentRepository;

@Service
@Transactional(readOnly = true)
public class LoanStatsService {

    private static final Logger log = LoggerFactory.getLogger(LoanStatsService.class);

    private final LoanRepository loanRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RestClient restClient;
    private final String internalSecret;

    public LoanStatsService(LoanRepository loanRepository,
                            RiskAssessmentRepository riskAssessmentRepository,
                            RestClient.Builder restClientBuilder,
                            @Value("${internal.shared-secret}") String internalSecret) {
        this.loanRepository = loanRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.restClient = restClientBuilder.build();
        this.internalSecret = internalSecret;
    }

    // --- Response Methods (Detailed Validation & Specific Exception Handling) ---

    public ResponseEntity<ReceptionistStatsResponse> getReceptionistStatsResponse(Long receptionistId) {
        if (receptionistId != null && receptionistId <= 0) {
            log.warn("Invalid receptionist ID provided: {}", receptionistId);
            return ResponseEntity.badRequest().build();
        }

        if (receptionistId != null) {
            try {
                AccountUserDto user = fetchAccountUser(receptionistId);
                if (user == null) {
                    log.warn("Receptionist not found with ID: {}", receptionistId);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                }
                if (user.role() != Role.BANK_RECEPTIONIST && user.role() != Role.BANK_ADMIN) {
                    log.warn("User ID: {} has role {} but expected BANK_RECEPTIONIST", receptionistId, user.role());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } catch (HttpClientErrorException.NotFound ex) {
                log.warn("Account service reported receptionist not found for ID: {}", receptionistId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            } catch (RestClientException ex) {
                log.error("Unable to communicate with account-service to verify receptionist ID: {}", receptionistId, ex);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }
        }

        try {
            ReceptionistStatsResponse response = getReceptionistStats(receptionistId);
            return ResponseEntity.ok(response);
        } catch (DataAccessException ex) {
            log.error("Database access error while aggregating receptionist stats for ID: {}", receptionistId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid parameter passed to receptionist stats calculation: {}", ex.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception ex) {
            log.error("Unexpected error occurred while generating receptionist stats for ID: {}", receptionistId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<OfficerStatsResponse> getOfficerStatsResponse(Long officerId) {
        if (officerId != null && officerId <= 0) {
            log.warn("Invalid loan officer ID provided: {}", officerId);
            return ResponseEntity.badRequest().build();
        }

        if (officerId != null) {
            try {
                AccountUserDto user = fetchAccountUser(officerId);
                if (user == null) {
                    log.warn("Loan officer not found with ID: {}", officerId);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                }
                if (user.role() != Role.LOAN_OFFICER && user.role() != Role.BANK_ADMIN) {
                    log.warn("User ID: {} has role {} but expected LOAN_OFFICER", officerId, user.role());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } catch (HttpClientErrorException.NotFound ex) {
                log.warn("Account service reported loan officer not found for ID: {}", officerId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            } catch (RestClientException ex) {
                log.error("Unable to communicate with account-service to verify officer ID: {}", officerId, ex);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }
        }

        try {
            OfficerStatsResponse response = getOfficerStats(officerId);
            return ResponseEntity.ok(response);
        } catch (DataAccessException ex) {
            log.error("Database access error while aggregating loan officer stats for ID: {}", officerId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid parameter passed to officer stats calculation: {}", ex.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception ex) {
            log.error("Unexpected error occurred while generating officer stats for ID: {}", officerId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<AdminStatsResponse> getAdminStatsResponse() {
        try {
            AdminStatsResponse response = getAdminStats();
            return ResponseEntity.ok(response);
        } catch (DataAccessException ex) {
            log.error("Database access error while aggregating admin portfolio stats", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception ex) {
            log.error("Unexpected error occurred while generating admin stats", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- Account Service Validation Helper ---

    private AccountUserDto fetchAccountUser(Long userId) {
        try {
            return restClient.get()
                    .uri("http://account-service/users/{id}", userId)
                    .header("X-Internal-Secret", internalSecret)
                    .retrieve()
                    .body(AccountUserDto.class);
        } catch (HttpClientErrorException.NotFound ex) {
            return null;
        }
    }

    private record AccountUserDto(Long id, Role role) {}

    // --- Core Aggregation Methods ---

    public ReceptionistStatsResponse getReceptionistStats(Long receptionistId) {
        long totalProcessed = loanRepository.countByReceptionistIdAndIntakeCompletedDateIsNotNull(receptionistId);
        long activeBacklog = loanRepository.countByReceptionistIdAndWorkflowTask(receptionistId, "Bank receptionist create loan request");
        long returnedCount = loanRepository.countByReceptionistIdAndRejectionCountGreaterThan(receptionistId, 0);

        double firstPassRatePercent = totalProcessed > 0
                ? Math.max(0.0, Math.round(((double) (totalProcessed - returnedCount) / totalProcessed) * 10000.0) / 100.0)
                : 100.0;

        List<TaskTurnaroundProjection> turnaroundDates = loanRepository.findIntakeTurnaroundDatesByReceptionistId(receptionistId);
        double avgIntakeTurnaroundHours = calculateAverageHours(turnaroundDates, true);

        List<LoanTypeCountProjection> typeProjections = loanRepository.findLoanTypeCountsByReceptionistId(receptionistId);
        List<LoanTypeAggregateDto> byLoanType = typeProjections.stream()
                .map(p -> new LoanTypeAggregateDto(
                        p.getType(),
                        p.getCount() != null ? p.getCount() : 0L,
                        p.getTotalAmount() != null ? Math.round(p.getTotalAmount() * 100.0) / 100.0 : 0.0
                ))
                .toList();

        return new ReceptionistStatsResponse(
                totalProcessed,
                activeBacklog,
                avgIntakeTurnaroundHours,
                firstPassRatePercent,
                returnedCount,
                byLoanType
        );
    }

    public OfficerStatsResponse getOfficerStats(Long officerId) {
        long totalEvaluated = loanRepository.countByCreditOfficerIdAndAssessmentCompletedDateIsNotNull(officerId);
        long returnedForRevisionCount = loanRepository.countByCreditOfficerIdAndRejectionCountGreaterThan(officerId, 0);

        long totalValidations = totalEvaluated + returnedForRevisionCount;
        double validationRatePercent = totalValidations > 0
                ? Math.round(((double) totalEvaluated / totalValidations) * 10000.0) / 100.0
                : 100.0;

        List<TaskTurnaroundProjection> turnaroundDates = loanRepository.findOfficerTurnaroundDatesByOfficerId(officerId);
        double avgAssessmentHours = calculateAverageHours(turnaroundDates, false);

        long pendingValidation = loanRepository.countByCreditOfficerIdAndWorkflowTask(officerId, "Loan officer validates bank receptionist request");
        long pendingRecommendation = loanRepository.countByCreditOfficerIdAndWorkflowTask(officerId, "Loan officer writes recommendation");

        OfficerQueueSplitDto queue = new OfficerQueueSplitDto(pendingValidation, pendingRecommendation);

        List<RiskScoreDistributionProjection> riskProjections = riskAssessmentRepository.countGroupedByRiskScore(officerId);
        List<RiskDistributionDto> riskDistribution = riskProjections.stream()
                .map(p -> new RiskDistributionDto(
                        p.getRiskScore(),
                        p.getCount() != null ? p.getCount() : 0L,
                        p.getAvgAmount() != null ? Math.round(p.getAvgAmount() * 100.0) / 100.0 : 0.0
                ))
                .toList();

        return new OfficerStatsResponse(
                totalEvaluated,
                validationRatePercent,
                returnedForRevisionCount,
                avgAssessmentHours,
                queue,
                riskDistribution
        );
    }

    public AdminStatsResponse getAdminStats() {
        AdminPortfolioProjection p = loanRepository.getAdminPortfolioSummary();

        double totalRequested = p != null && p.getTotalRequested() != null ? Math.round(p.getTotalRequested() * 100.0) / 100.0 : 0.0;
        double totalApproved = p != null && p.getTotalApproved() != null ? Math.round(p.getTotalApproved() * 100.0) / 100.0 : 0.0;

        long approvedLoans = p != null && p.getApprovedLoans() != null ? p.getApprovedLoans() : 0L;
        long rejectedLoans = p != null && p.getRejectedLoans() != null ? p.getRejectedLoans() : 0L;
        long totalDecided = approvedLoans + rejectedLoans;

        double approvalRatePercent = totalDecided > 0
                ? Math.round(((double) approvedLoans / totalDecided) * 10000.0) / 100.0
                : 0.0;

        double avgDuration = p != null && p.getAvgApprovedDuration() != null ? Math.round(p.getAvgApprovedDuration() * 10.0) / 10.0 : 0.0;
        double avgRate = p != null && p.getAvgApprovedInterestRate() != null ? Math.round(p.getAvgApprovedInterestRate() * 100.0) / 100.0 : 0.0;

        AdminPortfolioSummaryDto portfolio = new AdminPortfolioSummaryDto(
                totalRequested,
                totalApproved,
                approvalRatePercent,
                avgDuration,
                avgRate
        );

        List<PipelineStageProjection> stageProjections = loanRepository.getActivePipelineStages();
        List<PipelineStageDto> pipelineFunnel = stageProjections.stream()
                .map(stage -> new PipelineStageDto(
                        stage.getWorkflowTask(),
                        mapStageLabel(stage.getWorkflowTask()),
                        stage.getCount() != null ? stage.getCount() : 0L,
                        stage.getTotalAmount() != null ? Math.round(stage.getTotalAmount() * 100.0) / 100.0 : 0.0
                ))
                .toList();

        List<PortfolioByTypeProjection> typeProjections = loanRepository.getApprovedPortfolioByType();
        List<PortfolioByTypeDto> portfolioByType = typeProjections.stream()
                .map(item -> new PortfolioByTypeDto(
                        item.getType(),
                        item.getApprovedCount() != null ? item.getApprovedCount() : 0L,
                        item.getApprovedAmount() != null ? Math.round(item.getApprovedAmount() * 100.0) / 100.0 : 0.0,
                        item.getAvgInterestRate() != null ? Math.round(item.getAvgInterestRate() * 100.0) / 100.0 : 0.0
                ))
                .toList();

        return new AdminStatsResponse(portfolio, pipelineFunnel, portfolioByType);
    }

    private double calculateAverageHours(List<TaskTurnaroundProjection> dates, boolean isIntake) {
        if (dates == null || dates.isEmpty()) {
            return 0.0;
        }

        double totalHours = 0.0;
        int count = 0;

        for (TaskTurnaroundProjection d : dates) {
            if (isIntake) {
                if (d.getSubmissionDate() != null && d.getIntakeCompletedDate() != null) {
                    long diffMs = d.getIntakeCompletedDate().getTime() - d.getSubmissionDate().getTime();
                    if (diffMs >= 0) {
                        totalHours += (double) diffMs / (1000.0 * 60.0 * 60.0);
                        count++;
                    }
                }
            } else {
                if (d.getIntakeCompletedDate() != null && d.getAssessmentCompletedDate() != null) {
                    long diffMs = d.getAssessmentCompletedDate().getTime() - d.getIntakeCompletedDate().getTime();
                    if (diffMs >= 0) {
                        totalHours += (double) diffMs / (1000.0 * 60.0 * 60.0);
                        count++;
                    }
                }
            }
        }

        return count > 0 ? Math.round((totalHours / count) * 10.0) / 10.0 : 0.0;
    }

    private String mapStageLabel(String workflowTask) {
        if (workflowTask == null) {
            return "In Progress";
        }
        return switch (workflowTask) {
            case "Bank receptionist create loan request" -> "Intake";
            case "Loan officer validates bank receptionist request" -> "Document Validation";
            case "Loan officer writes recommendation" -> "Risk Scoring";
            case "Bank admin validation" -> "Executive Approval";
            case "Bank admin fills credit and final decision fields" -> "Terms Finalization";
            default -> workflowTask;
        };
    }
}
