export interface Notification {
  id: number;
  loanId: number;
  userId: number;
  message: string;
  timestamp: Date;
  read: boolean;
}
