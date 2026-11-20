
import { Request, Response, NextFunction } from "express";

// 404 Not Found Handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// Global Error Handler
export const errorHandler = (
  error: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("API Error:", error.message);

  const statusCode =
    error.statusCode || error.status || 500;

  const safeStatusCode =
    statusCode >= 400 && statusCode < 600
      ? statusCode
      : 500;

  const message =
    safeStatusCode === 500
      ? "Internal Server Error"
      : error.message;

  return res.status(safeStatusCode).json({
    success: false,
    message,
  });
};
