
import { Router } from "express";

import {
  getAllUsers,
  getSingleUser,
  blockUser,
  unblockUser,
} from "../controllers/admin.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Get All Users
router.get(
  "/users",
  authenticateUser,
  authorizeRoles("admin"),
  getAllUsers
);

// Get Single User
router.get(
  "/users/:id",
  authenticateUser,
  authorizeRoles("admin"),
  getSingleUser
);

// Block User
router.patch(
  "/users/:id/block",
  authenticateUser,
  authorizeRoles("admin"),
  blockUser
);

// Unblock User
router.patch(
  "/users/:id/unblock",
  authenticateUser,
  authorizeRoles("admin"),
  unblockUser
);

export default router;
