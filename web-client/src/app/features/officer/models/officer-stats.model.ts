export interface OfficerQueueSplitDto {
  pendingValidation: number;
  pendingRecommendation: number;
}

export interface RiskDistributionDto {
  riskScore: string;
  count: number;
  avgAmount: number;
}

export interface OfficerStatsResponse {
  totalEvaluated: number;
  validationRatePercent: number;
  returnedForRevisionCount: number;
  avgAssessmentHours: number;
  queue: OfficerQueueSplitDto;
  riskDistribution: RiskDistributionDto[];
}
