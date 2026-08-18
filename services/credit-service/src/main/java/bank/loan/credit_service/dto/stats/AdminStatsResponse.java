package bank.loan.credit_service.dto.stats;

import java.util.List;

public record AdminStatsResponse(
    AdminPortfolioSummaryDto portfolio,
    List<PipelineStageDto> pipelineFunnel,
    List<PortfolioByTypeDto> portfolioByType
) {
    public record AdminPortfolioSummaryDto(
        double totalCapitalRequested,
        double totalCapitalApproved,
        double approvalRatePercent,
        double avgApprovedDurationMonths,
        double avgInterestRate
    ) {}

    public record PipelineStageDto(
        String stageKey,
        String stageLabel,
        long count,
        double totalAmount
    ) {}

    public record PortfolioByTypeDto(
        String type,
        long approvedCount,
        double approvedAmount,
        double avgInterestRate
    ) {}
}
