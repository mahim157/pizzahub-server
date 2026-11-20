
import { Router } from "express";

import {
  createCheckoutSession,
  cancelSubscription,
} from "../controllers/subscription.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Vendor: Create Premium Checkout Session
router.post(
  "/checkout-session",
  authenticateUser,
  authorizeRoles("vendor"),
  createCheckoutSession
);

// Vendor: Cancel Premium Subscription
router.post(
  "/cancel",
  authenticateUser,
  authorizeRoles("vendor"),
  cancelSubscription
);

export default router;
