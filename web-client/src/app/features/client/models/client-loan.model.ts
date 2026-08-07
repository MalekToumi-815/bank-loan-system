export interface ClientLoan {
  id: number;
  submissionDate: string | null;
  startDate: string | null;
  amount: number | null;
  type: string | null;
  durationMonths: number | null;
  interestRate: number | null;
  workflowProcessInstanceId: string | null;
  status: string | null;
  finalDecision: string | null;
  AdminrejectionReason: string | null;
  OfficerrejectionReason: string | null;
  receptionistId: number | null;
  creditOfficerId: number | null;
  bankAdminId: number | null;
  workflowTask: string | null;
  clientId: number | null;
}
