
export type SubscriptionPlan = "free" | "premium";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export interface ITransaction {
  _id?: string;
  vendorId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt?: Date;
}
