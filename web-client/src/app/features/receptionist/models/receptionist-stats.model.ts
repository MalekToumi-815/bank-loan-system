export interface LoanTypeAggregateDto {
  type: string;
  count: number;
  totalAmount: number;
}

export interface ReceptionistStatsResponse {
  totalProcessed: number;
  activeBacklog: number;
  avgIntakeTurnaroundHours: number;
  firstPassRatePercent: number;
  returnedCount: number;
  byLoanType: LoanTypeAggregateDto[];
}
