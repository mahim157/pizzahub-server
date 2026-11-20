
import { z } from "zod";

// Create Order Validation (Customer only)
export const orderValidationSchema = z.strictObject({
  itemId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid menu item ID"
    ),

  deliveryDate: z
    .string()
    .min(1, "Delivery date is required")
    .refine(
      (value) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
      },
      "Invalid delivery date"
    ),

  deliveryAddress: z
    .string()
    .trim()
    .min(
      10,
      "Delivery address must be at least 10 characters long"
    )
    .max(
      500,
      "Delivery address cannot exceed 500 characters"
    ),

  message: z
    .string()
    .trim()
    .max(
      500,
      "Message cannot exceed 500 characters"
    )
    .optional(),
});

// Update Order Status Validation
export const updateOrderStatusSchema = z.strictObject({
  status: z.enum([
    "accepted",
    "rejected",
    "cancelled",
  ]),
});
