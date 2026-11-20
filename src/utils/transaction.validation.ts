
import { z } from "zod";

// Premium Subscription Transaction Validation
export const transactionValidationSchema = z.strictObject({
  plan: z.literal("premium", {
    error: "Only premium subscription plan is allowed",
  }),
});
