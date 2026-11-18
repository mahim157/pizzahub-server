
import { Collection, Document } from "mongodb";
import { connectDB } from "../config/db.js";
import { IMenuItem } from "../types/menuItem.types.js";

export const getMenuItemCollection = async (): Promise<
  Collection<IMenuItem & Document>
> => {
  const db = await connectDB();

  return db.collection<IMenuItem & Document>("menuItems");
};
