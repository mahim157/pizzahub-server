
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

// Stripe Configuration
export const getStripe = (): Stripe => {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing from .env file"
    );
  }

  return new Stripe(STRIPE_SECRET_KEY);
};
