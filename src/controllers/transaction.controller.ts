
import { Request, Response } from "express";
import { getTransactionCollection } from "../models/transaction.model.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// 1. Vendor: নিজের সব Transactions দেখা
export const getVendorTransactions = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transactionCollection = await getTransactionCollection();

    const transactions = await transactionCollection
      .find({ vendorId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Vendor transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Get Vendor Transactions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve vendor transactions",
    });
  }
};

// 2. Admin: সব Transactions দেখা
export const getAllTransactionsForAdmin = async (
  _req: Request,
  res: Response
) => {
  try {
    const transactionCollection = await getTransactionCollection();

    const transactions = await transactionCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "All transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Get All Transactions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
    });
  }
};
