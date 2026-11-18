
import { z } from "zod";

export const transactionValidationSchema = z.object({
  plan: z.literal("premium"),
});

