import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import { auth } from "./config/auth.js";

import { toNodeHandler } from "better-auth/node";

import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

import menuItemRoutes from "./routes/menuItem.routes.js";
import orderRoutes from "./routes/order.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import imageRoutes from "./routes/image.routes.js";

import {
  handleStripeWebhook,
} from "./controllers/webhook.controller.js";

dotenv.config();

const app = express();

// Trust Vercel reverse proxy for secure cookies
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_URL?.replace(/\/$/, "");

// CORS Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://pizzahub-client-2wd4.vercel.app",
      ...(clientOrigin ? [clientOrigin] : []),
    ],
    credentials: true,
  })
);

// Ensure MongoDB connection on every serverless request before auth/API routes
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Better Auth Handler
app.all("/api/auth/{*any}", toNodeHandler(auth));

// Stripe Webhook (Must be before express.json())
app.post(
  "/api/subscriptions/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// JSON Middleware with 1MB request body limit
app.use(express.json({ limit: "1mb" }));

// API Routes
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imageRoutes);

// Home Route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to PizzaHub Backend API!",
  });
});

// Health Check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PizzaHub Server is running successfully.",
  });
});

// Not Found Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Start Server (Local development)
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`PizzaHub Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start PizzaHub Server:", error);
      process.exit(1);
    }
  };

  startServer();
}

export default app;