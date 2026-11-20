
import { Router } from "express";

import {
  getVendorTransactions,
  getAllTransactionsForAdmin,
} from "../controllers/transaction.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Vendor: নিজের Transactions দেখা
router.get(
  "/my-transactions",
  authenticateUser,
  authorizeRoles("vendor"),
  getVendorTransactions
);

// Admin: সব Transactions দেখা
router.get(
  "/admin/all",
  authenticateUser,
  authorizeRoles("admin"),
  getAllTransactionsForAdmin
);

export default router;
