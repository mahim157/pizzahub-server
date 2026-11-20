
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { getStripe } from "../config/stripe.js";
import { connectDB } from "../config/db.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// ==========================================
// 1. Vendor: Create Stripe Checkout Session
// ==========================================

export const createCheckoutSession = async (
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

    if (!ObjectId.isValid(user.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const db = await connectDB();

    const vendor = await db.collection("user").findOne({
      _id: new ObjectId(user.id),
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can purchase Premium subscription",
      });
    }

    if (vendor.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    if (
      vendor.subscriptionPlan === "premium" &&
      vendor.subscriptionExpiresAt &&
      new Date(vendor.subscriptionExpiresAt) > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have an active Premium subscription",
      });
    }

    const stripe = getStripe();

    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({
        success: false,
        message: "Stripe Premium Price ID is not configured",
      });
    }

    const clientURL =
      process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: vendor.email,

      metadata: {
        vendorId: user.id,
        plan: "premium",
      },

      subscription_data: {
        metadata: {
          vendorId: user.id,
          plan: "premium",
        },
      },

      success_url: `${clientURL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${clientURL}/payment/cancel`,
    });

    return res.status(200).json({
      success: true,
      message: "Stripe Checkout Session created successfully",
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    console.error("Create Checkout Session Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Stripe Checkout Session",
    });
  }
};

// ==========================================
// 2. Vendor: Cancel Premium Subscription
// ==========================================

export const cancelSubscription = async (
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

    if (!ObjectId.isValid(user.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const db = await connectDB();

    const userCollection = db.collection("user");
    const transactionCollection = db.collection("transactions");

    const vendor = await userCollection.findOne({
      _id: new ObjectId(user.id),
      role: "vendor",
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found",
      });
    }

    if (vendor.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    // Find the vendor's latest completed subscription
    const transaction = await transactionCollection.findOne(
      {
        vendorId: user.id,
        plan: "premium",
        status: "completed",
        stripeSubscriptionId: {
          $exists: true,
          $ne: null,
        },
      },
      {
        sort: {
          createdAt: -1,
        },
      }
    );

    if (!transaction?.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    const stripe = getStripe();

    const subscription =
      await stripe.subscriptions.retrieve(
        transaction.stripeSubscriptionId
      );

    // Verify subscription ownership
    if (subscription.metadata.vendorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel another vendor's subscription",
      });
    }

    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      return res.status(400).json({
        success: false,
        message: "Subscription is not active",
      });
    }

    if (subscription.cancel_at_period_end) {
      return res.status(400).json({
        success: false,
        message: "Subscription is already scheduled for cancellation",
      });
    }

    // Schedule cancellation at the end of billing period
    const updatedSubscription =
      await stripe.subscriptions.update(
        transaction.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Subscription cancellation scheduled successfully",
      data: {
        subscriptionId: updatedSubscription.id,
        cancelAtPeriodEnd:
          updatedSubscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error("Cancel Subscription Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
};