package bank.loan.credit_service.dto.stats;

import java.util.List;

public record OfficerStatsResponse(
    long totalEvaluated,
    double validationRatePercent,
    long returnedForRevisionCount,
    double avgAssessmentHours,
    OfficerQueueSplitDto queue,
    List<RiskDistributionDto> riskDistribution
) {
    public record OfficerQueueSplitDto(
        long pendingValidation,
        long pendingRecommendation
    ) {}

    public record RiskDistributionDto(
        String riskScore,
        long count,
        double avgAmount
    ) {}
}
