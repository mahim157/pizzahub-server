
import { z } from "zod";

export const menuItemValidationSchema = z.strictObject({
  itemName: z
    .string()
    .trim()
    .min(3, "Pizza name must be at least 3 characters long")
    .max(100, "Pizza name cannot exceed 100 characters"),

  category: z.enum([
    "Classic Pizzas",
    "Vegetarian Pizzas",
    "Meat Lovers",
    "Specialty / Gourmet Pizzas",
    "Sides & Appetizers",
    "Beverages & Desserts",
  ]),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description cannot exceed 1000 characters"),

  price: z
    .number()
    .positive("Price must be greater than 0")
    .finite("Price must be a valid number"),

  location: z.strictObject({
    area: z.string().trim().min(2, "Area is required"),
    city: z.string().trim().min(2, "City is required"),
  }),

  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required"),
});

export const updateMenuItemValidationSchema =
  menuItemValidationSchema.partial();