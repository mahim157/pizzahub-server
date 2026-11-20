
import { Router } from "express";

import {
  createMenuItem,
  getApprovedMenuItems,
  getApprovedMenuItemById,
  getVendorMenuItems,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItemsForAdmin,
  updateMenuItemApproval,
} from "../controllers/menuItem.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Vendor: Create a new menu item
router.post(
  "/",
  authenticateUser,
  authorizeRoles("vendor"),
  createMenuItem
);

// Vendor: Get own menu items
router.get(
  "/my-items",
  authenticateUser,
  authorizeRoles("vendor"),
  getVendorMenuItems
);

// Admin: Get all menu items
router.get(
  "/admin/all",
  authenticateUser,
  authorizeRoles("admin"),
  getAllMenuItemsForAdmin
);

// Admin: Approve or Reject menu item
router.patch(
  "/admin/:id/status",
  authenticateUser,
  authorizeRoles("admin"),
  updateMenuItemApproval
);

// Vendor: Update own menu item
router.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("vendor"),
  updateMenuItem
);

// Vendor: Delete own menu item
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("vendor"),
  deleteMenuItem
);

// Customer: Get all approved menu items
router.get("/", getApprovedMenuItems);

// Customer: Get a single approved menu item
router.get("/:id", getApprovedMenuItemById);

export default router;
