import { ObjectId } from "mongodb";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface IOrderTimelineEntry {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface IOrder {
  _id?: ObjectId;
  itemId: ObjectId;
  vendorId: string;
  customerId: string;
  deliveryDate: Date;
  deliveryAddress: string;
  message?: string;
  status: OrderStatus;
  statusHistory?: IOrderTimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}
