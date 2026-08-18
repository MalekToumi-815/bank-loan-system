package bank.loan.credit_service.dto.stats;

import java.util.List;

public record ReceptionistStatsResponse(
    long totalProcessed,
    long activeBacklog,
    double avgIntakeTurnaroundHours,
    double firstPassRatePercent,
    long returnedCount,
    List<LoanTypeAggregateDto> byLoanType
) {
    public record LoanTypeAggregateDto(
        String type,
        long count,
        double totalAmount
    ) {}
}
