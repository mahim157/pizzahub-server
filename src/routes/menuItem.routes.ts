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
  addMenuItemReview,
  toggleFavoriteMenuItem,
  getMyFavoriteMenuItems,
} from "../controllers/menuItem.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public: Get all approved menu items
router.get("/", getApprovedMenuItems);

// Authenticated: Get my favorite menu items
router.get(
  "/favorites/my",
  authenticateUser,
  getMyFavoriteMenuItems
);

// Vendor: Create a new menu item
router.post(
  "/",
  authenticateUser,
  authorizeRoles("vendor"),
  createMenuItem
);

// Vendor: Get own menu items
router.get(
  "/vendor/my-items",
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

// Admin: Approve or reject a menu item
router.patch(
  "/admin/:id/approval",
  authenticateUser,
  authorizeRoles("admin"),
  updateMenuItemApproval
);

// Public: Get one approved menu item by ID
router.get("/:id", getApprovedMenuItemById);

// Customer: Add or update a review
router.post(
  "/:id/reviews",
  authenticateUser,
  authorizeRoles("customer"),
  addMenuItemReview
);

// Authenticated: Toggle favorite menu item
router.post(
  "/:id/favorite",
  authenticateUser,
  toggleFavoriteMenuItem
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

export default router;
