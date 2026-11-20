
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { connectDB } from "../config/db.js";

// Helper: Safely get user ID from route params
const getUserId = (req: Request): string | null => {
  const id = req.params.id;

  if (typeof id !== "string") {
    return null;
  }

  return id;
};

// ==========================================
// 1. Admin: Get All Users
// ==========================================

export const getAllUsers = async (
  _req: Request,
  res: Response
) => {
  try {
    const db = await connectDB();

    const users = await db.collection("user")
      .find(
        {},
        {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            image: 1,
            role: 1,
            isBlocked: 1,
            businessName: 1,
            subscriptionPlan: 1,
            subscriptionExpiresAt: 1,
            createdAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "All users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};

// ==========================================
// 2. Admin: Get Single User
// ==========================================

export const getSingleUser = async (
  req: Request,
  res: Response
) => {
  try {
    const id = getUserId(req);

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const db = await connectDB();

    const user = await db.collection("user").findOne(
      {
        _id: new ObjectId(id),
      },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          image: 1,
          role: 1,
          isBlocked: 1,
          businessName: 1,
          subscriptionPlan: 1,
          subscriptionExpiresAt: 1,
          createdAt: 1,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get Single User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
    });
  }
};

// ==========================================
// 3. Admin: Block User
// ==========================================

export const blockUser = async (
  req: Request,
  res: Response
) => {
  try {
    const id = getUserId(req);

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const db = await connectDB();

    const userCollection = db.collection("user");

    const targetUser = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent blocking Admin accounts
    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be blocked",
      });
    }

    if (targetUser.isBlocked === true) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    await userCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          isBlocked: true,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Block User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to block user",
    });
  }
};

// ==========================================
// 4. Admin: Unblock User
// ==========================================

export const unblockUser = async (
  req: Request,
  res: Response
) => {
  try {
    const id = getUserId(req);

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const db = await connectDB();

    const userCollection = db.collection("user");

    const targetUser = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be modified",
      });
    }

    if (targetUser.isBlocked !== true) {
      return res.status(400).json({
        success: false,
        message: "User is not blocked",
      });
    }

    await userCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          isBlocked: false,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Unblock User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unblock user",
    });
  }
};
