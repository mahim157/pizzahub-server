
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from .env file");
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is missing from .env file");
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is missing from .env file");
}

const client = new MongoClient(MONGODB_URI);

// Better Auth Configuration
export const auth = betterAuth({
  // Application URL
  baseURL: process.env.BETTER_AUTH_URL,

  // Secret Key
  secret: process.env.BETTER_AUTH_SECRET,

  // MongoDB Database
  database: mongodbAdapter(client.db("pizzahub")),

  // Email and Password Authentication
  emailAndPassword: {
    enabled: true,
  },

  // JWT Plugin
  plugins: [
    jwt(),
  ],

  // Additional User Fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        input: false,
      },

      isBlocked: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },

      businessName: {
        type: "string",
        required: false,
        input: false,
      },

      subscriptionPlan: {
        type: "string",
        required: true,
        defaultValue: "free",
        input: false,
      },

      subscriptionExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
});
