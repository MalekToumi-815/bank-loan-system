package bank.loan.credit_service.dto.loan;

import java.util.Map;

public record LoanStatsResponse(
    long total,
    Map<String, Long> byStatus
) {}
