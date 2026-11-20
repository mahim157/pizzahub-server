
import { Router } from "express";

import {
  createOrder,
  getCustomerOrders,
  getVendorOrders,
  updateOrderStatus,
  getAllOrdersForAdmin,
} from "../controllers/order.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Customer: Place a new order
router.post(
  "/",
  authenticateUser,
  authorizeRoles("customer"),
  createOrder
);

// Customer: Get own orders
router.get(
  "/my-orders",
  authenticateUser,
  authorizeRoles("customer"),
  getCustomerOrders
);

// Vendor: Get incoming orders
router.get(
  "/vendor",
  authenticateUser,
  authorizeRoles("vendor"),
  getVendorOrders
);

// Customer / Vendor: Update order status
router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRoles("customer", "vendor"),
  updateOrderStatus
);

// Admin: Get all orders
router.get(
  "/admin/all",
  authenticateUser,
  authorizeRoles("admin"),
  getAllOrdersForAdmin
);

export default router;
