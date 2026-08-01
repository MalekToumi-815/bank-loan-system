export interface ClientLoan {
  id: number;
  submissionDate: string | null;
  amount: number | null;
  type: string | null;
  durationMonths: number | null;
  interestRate: number | null;
  workflowProcessInstanceId: string | null;
  status: string | null;
  finalDecision: string | null;
}
