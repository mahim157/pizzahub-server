
import { Collection, Document } from "mongodb";
import { connectDB } from "../config/db.js";
import { ITransaction } from "../types/transaction.types.js";

export const getTransactionCollection = async (): Promise<
  Collection<ITransaction & Document>
> => {
  const db = await connectDB();

  return db.collection<ITransaction & Document>("transactions");
};
