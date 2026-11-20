
import { ObjectId } from "mongodb";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface IOrder {
  _id?: ObjectId;
  itemId: ObjectId;
  vendorId: string;
  customerId: string;
  deliveryDate: Date;
  deliveryAddress: string;
  message?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
