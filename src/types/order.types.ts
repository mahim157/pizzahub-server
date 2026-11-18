
export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface IOrder {
  _id?: string;
  itemId: string;
  vendorId: string;
  customerId: string;
  deliveryDate: Date;
  deliveryAddress: string;
  message?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
