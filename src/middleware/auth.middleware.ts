
import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  isBlocked: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Better Auth JWKS endpoint
const jwks = createRemoteJWKSet(
  new URL("/api/auth/jwks", process.env.BETTER_AUTH_URL!)
);

// Verify JWT and check current user status
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(token, jwks);

    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.isBlocked !== "boolean"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    if (!ObjectId.isValid(payload.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Get current user information from MongoDB
    const db = await connectDB();

    const currentUser = await db.collection("user").findOne({
      _id: new ObjectId(payload.id),
    });

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // Check current blocked status from database
    if (currentUser.isBlocked === true) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    // Validate current database role
    if (
      !["customer", "vendor", "admin"].includes(currentUser.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // Attach current user information to request
    (req as AuthenticatedRequest).user = {
      id: payload.id,
      email: currentUser.email,
      role: currentUser.role as AuthenticatedUser["role"],
      isBlocked: currentUser.isBlocked === true,
    };

    next();
  } catch (error) {
    console.error("Authentication Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

// Role-Based Authorization
export const authorizeRoles = (
  ...allowedRoles: AuthenticatedUser["role"][]
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};
