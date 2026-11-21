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
const isProduction = process.env.NODE_ENV === "production";
const clientOrigin = process.env.CLIENT_URL?.replace(/\/$/, "");

// Better Auth Configuration
export const auth = betterAuth({
  // Application URL
  baseURL: process.env.BETTER_AUTH_URL,

  // Trusted Origins
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
    "https://pizzahub-client-2wd4.vercel.app",
    ...(clientOrigin ? [clientOrigin] : []),
  ],

  // Cross-Domain Cookie Configuration for Vercel
  advanced: {
    defaultCookieAttributes: {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      httpOnly: true,
    },
  },

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
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
        }),
      },
    }),
  ],

  // Additional User Fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        input: true,
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
        input: true,
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

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const allowedSignupRoles = ["customer", "vendor"];
          const safeRole = allowedSignupRoles.includes(user.role as string)
            ? user.role
            : "customer";

          return {
            data: {
              ...user,
              role: safeRole,
            },
          };
        },
      },
    },
  },
});