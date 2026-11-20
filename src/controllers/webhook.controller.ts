
import { Request, Response } from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

import { getStripe } from "../config/stripe.js";
import { connectDB } from "../config/db.js";

// ==========================================
// Stripe Webhook Handler
// ==========================================

export const handleStripeWebhook = async (
  req: Request,
  res: Response
) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Check Stripe configuration
  if (!signature || !webhookSecret) {
    console.error("Stripe webhook configuration is missing");

    return res.status(400).json({
      success: false,
      message: "Stripe webhook configuration is missing",
    });
  }

  let event: Stripe.Event;

  // ==========================================
  // 1. Verify Stripe Webhook Signature
  // ==========================================

  try {
    const stripe = getStripe();

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );

    console.log("------------------------------------");
    console.log("Stripe Webhook Event Received:", event.type);
    console.log("Stripe Event ID:", event.id);
    console.log("------------------------------------");

  } catch (error) {
    console.error("Stripe Webhook Signature Error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature",
    });
  }

  // ==========================================
  // 2. Process Webhook Event
  // ==========================================

  try {
    const db = await connectDB();

    const userCollection = db.collection("user");
    const transactionCollection = db.collection("transactions");

    // ==========================================
    // 3. Checkout Session Completed
    // ==========================================

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Processing Checkout Session:", session.id);
      console.log("Checkout Mode:", session.mode);
      console.log("Payment Status:", session.payment_status);

      // Only subscription checkout is supported
      if (session.mode !== "subscription") {
        console.log("Non-subscription checkout ignored");

        return res.status(200).json({
          received: true,
          message: "Non-subscription checkout ignored",
        });
      }

      // Verify payment status
      if (session.payment_status !== "paid") {
        console.log("Payment is not completed yet");

        return res.status(200).json({
          received: true,
          message: "Payment is not completed yet",
        });
      }

      // Get Vendor ID from Stripe metadata
      const vendorId = session.metadata?.vendorId;

      console.log("Vendor ID from Checkout:", vendorId);

      if (!vendorId || !ObjectId.isValid(vendorId)) {
        console.error("Invalid vendor ID in Stripe metadata");

        return res.status(400).json({
          success: false,
          message: "Invalid vendor information",
        });
      }

      const vendorObjectId = new ObjectId(vendorId);

      // Find Vendor
      const vendor = await userCollection.findOne({
        _id: vendorObjectId,
        role: "vendor",
      });

      if (!vendor) {
        console.error("Vendor not found in MongoDB:", vendorId);

        return res.status(404).json({
          success: false,
          message: "Vendor account not found",
        });
      }

      console.log("Vendor found:", vendor.email);

      // Get Stripe Subscription ID
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId) {
        console.error("Stripe subscription ID is missing");

        return res.status(400).json({
          success: false,
          message: "Stripe subscription ID is missing",
        });
      }

      // Retrieve Subscription from Stripe
      const stripe = getStripe();

      const subscription =
        await stripe.subscriptions.retrieve(subscriptionId);

      console.log("Stripe Subscription ID:", subscription.id);
      console.log("Stripe Subscription Status:", subscription.status);

      // Verify Subscription Status
      if (
        subscription.status !== "active" &&
        subscription.status !== "trialing"
      ) {
        console.log("Subscription is not active");

        return res.status(200).json({
          received: true,
          message: "Subscription is not active",
        });
      }

      // Verify Subscription Ownership
      if (subscription.metadata.vendorId !== vendorId) {
        console.error("Subscription ownership verification failed");

        return res.status(403).json({
          success: false,
          message: "Subscription ownership verification failed",
        });
      }

      // Get Subscription Expiry Date
      const subscriptionItem = subscription.items.data[0];

      if (!subscriptionItem) {
        console.error("Subscription item not found");

        return res.status(400).json({
          success: false,
          message: "Subscription item not found",
        });
      }

      const expiresAt = new Date(
        subscriptionItem.current_period_end * 1000
      );

      // ==========================================
      // 4. Save Transaction in MongoDB
      // ==========================================

      const transactionResult =
        await transactionCollection.updateOne(
          {
            stripeSessionId: session.id,
          },
          {
            $setOnInsert: {
              vendorId,
              plan: "premium",
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
              stripeSessionId: session.id,
              stripeSubscriptionId: subscriptionId,
              status: "completed",
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
          }
        );

      console.log("Transaction Update Result:", {
        matchedCount: transactionResult.matchedCount,
        modifiedCount: transactionResult.modifiedCount,
        upsertedCount: transactionResult.upsertedCount,
      });

      // ==========================================
      // 5. Activate Premium Subscription
      // ==========================================

      const userUpdateResult = await userCollection.updateOne(
        {
          _id: vendorObjectId,
          role: "vendor",
        },
        {
          $set: {
            subscriptionPlan: "premium",
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date(),
          },
        }
      );

      console.log("Vendor Update Result:", {
        matchedCount: userUpdateResult.matchedCount,
        modifiedCount: userUpdateResult.modifiedCount,
      });

      if (userUpdateResult.matchedCount === 0) {
        console.error("Vendor Premium update failed:", vendorId);

        return res.status(404).json({
          success: false,
          message: "Vendor could not be updated",
        });
      }

      console.log("====================================");
      console.log("PREMIUM SUBSCRIPTION ACTIVATED");
      console.log("Vendor ID:", vendorId);
      console.log("Vendor Email:", vendor.email);
      console.log("Subscription ID:", subscriptionId);
      console.log("Expires At:", expiresAt);
      console.log("====================================");
    }

    // ==========================================
    // 6. Subscription Updated / Renewed
    // ==========================================

    else if (event.type === "customer.subscription.updated") {
      const subscription =
        event.data.object as Stripe.Subscription;

      const vendorId = subscription.metadata?.vendorId;

      console.log("Subscription Updated:", subscription.id);
      console.log("Vendor ID:", vendorId);
      console.log("Subscription Status:", subscription.status);

      if (!vendorId || !ObjectId.isValid(vendorId)) {
        console.error("Invalid vendor ID in subscription metadata");

        return res.status(200).json({
          received: true,
          message: "Subscription vendor metadata is missing or invalid",
        });
      }

      const vendorObjectId = new ObjectId(vendorId);

      if (
        subscription.status === "active" ||
        subscription.status === "trialing"
      ) {
        const subscriptionItem = subscription.items.data[0];

        if (subscriptionItem) {
          const expiresAt = new Date(
            subscriptionItem.current_period_end * 1000
          );

          const result = await userCollection.updateOne(
            {
              _id: vendorObjectId,
              role: "vendor",
            },
            {
              $set: {
                subscriptionPlan: "premium",
                subscriptionExpiresAt: expiresAt,
                updatedAt: new Date(),
              },
            }
          );

          console.log("Subscription Update Result:", {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
          });

          console.log(
            `Subscription updated for vendor: ${vendorId}`
          );
        }
      }

      // Downgrade for terminal subscription statuses
      else if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid" ||
        subscription.status === "incomplete_expired"
      ) {
        const result = await userCollection.updateOne(
          {
            _id: vendorObjectId,
            role: "vendor",
          },
          {
            $set: {
              subscriptionPlan: "free",
              subscriptionExpiresAt: null,
              updatedAt: new Date(),
            },
          }
        );

        console.log("Vendor Downgrade Result:", {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        });

        console.log(
          `Vendor downgraded to Free: ${vendorId}`
        );
      }
    }

    // ==========================================
    // 7. Subscription Deleted / Expired
    // ==========================================

    else if (event.type === "customer.subscription.deleted") {
      const subscription =
        event.data.object as Stripe.Subscription;

      const vendorId = subscription.metadata?.vendorId;

      console.log("Subscription Deleted:", subscription.id);
      console.log("Vendor ID:", vendorId);

      if (!vendorId || !ObjectId.isValid(vendorId)) {
        console.error("Invalid vendor ID in deleted subscription");

        return res.status(200).json({
          received: true,
          message: "Subscription vendor metadata is missing or invalid",
        });
      }

      const vendorObjectId = new ObjectId(vendorId);

      const userResult = await userCollection.updateOne(
        {
          _id: vendorObjectId,
          role: "vendor",
        },
        {
          $set: {
            subscriptionPlan: "free",
            subscriptionExpiresAt: null,
            updatedAt: new Date(),
          },
        }
      );

      const transactionResult =
        await transactionCollection.updateOne(
          {
            stripeSubscriptionId: subscription.id,
          },
          {
            $set: {
              status: "cancelled",
              updatedAt: new Date(),
            },
          }
        );

      console.log("Subscription Delete Results:", {
        userMatched: userResult.matchedCount,
        transactionMatched: transactionResult.matchedCount,
      });

      console.log(
        `Subscription expired for vendor: ${vendorId}`
      );
    }

    // ==========================================
    // 8. Webhook Successfully Processed
    // ==========================================

    console.log("Stripe Webhook Processed Successfully:", event.id);

    return res.status(200).json({
      received: true,
      message: "Stripe webhook processed successfully",
    });

  } catch (error) {
    console.error("Stripe Webhook Processing Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process Stripe webhook",
    });
  }
};
