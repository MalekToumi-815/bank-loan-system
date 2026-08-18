export interface AdminPortfolioSummary {
  totalCapitalRequested: number;
  totalCapitalApproved: number;
  approvalRatePercent: number;
  avgApprovedDurationMonths: number;
  avgInterestRate: number;
}

export interface PipelineStage {
  stageKey: string;
  stageLabel: string;
  count: number;
  totalAmount: number;
}

export interface PortfolioByType {
  type: string;
  approvedCount: number;
  approvedAmount: number;
  avgInterestRate: number;
}

export interface AdminStatsResponse {
  portfolio: AdminPortfolioSummary;
  pipelineFunnel: PipelineStage[];
  portfolioByType: PortfolioByType[];
}
