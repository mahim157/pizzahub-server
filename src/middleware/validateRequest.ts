
import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// Reusable Zod Validation Middleware
export const validateRequest = (schema: ZodType) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = schema.safeParse(req.body);

    // Handle validation errors
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // Replace request body with validated data
    req.body = result.data;

    return next();
  };
};
