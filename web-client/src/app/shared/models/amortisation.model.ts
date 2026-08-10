export interface Instalment {
  id: number;
  dueDate: string;
  amount: number;
  status: string;
}

export interface AmortisationResponse {
  status: string;
  loanId: number;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  installements: Instalment[];
}
