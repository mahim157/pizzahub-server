
import { Collection, Document } from "mongodb";
import { connectDB } from "../config/db.js";
import { IOrder } from "../types/order.types.js";

export const getOrderCollection = async (): Promise<
  Collection<IOrder & Document>
> => {
  const db = await connectDB();

  return db.collection<IOrder & Document>("orders");
};
