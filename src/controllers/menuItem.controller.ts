import { connectDB } from "../config/db.js";
import { Request, Response } from "express";
import { ObjectId, Document } from "mongodb";

import { getMenuItemCollection } from "../models/menuItem.model.js";

import {
  menuItemValidationSchema,
  updateMenuItemValidationSchema,
} from "../utils/menuItem.validation.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// Better Auth User type
type BetterAuthUser = Document & {
  _id: string | ObjectId;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date | string;
};

// 1. Create a new menu item (Vendor only)
export const createMenuItem = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can create menu items",
      });
    }

    const parsed = menuItemValidationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const newMenuItem = {
      ...parsed.data,
      vendorId: user.id,
      status: "pending" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await menuItemCollection.insertOne(newMenuItem);

    return res.status(201).json({
      success: true,
      message:
        "Menu item created successfully. Waiting for admin approval.",
      data: {
        _id: result.insertedId,
        ...newMenuItem,
      },
    });
  } catch (error) {
    console.error("Create Menu Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create menu item",
    });
  }
};

// 2. Get all approved menu items
export const getApprovedMenuItems = async (
  _req: Request,
  res: Response
) => {
  try {
    const menuItemCollection = await getMenuItemCollection();

    const menuItems = await menuItemCollection
      .find({ status: "approved" })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Approved menu items retrieved successfully",
      data: menuItems,
    });
  } catch (error) {
    console.error("Get Menu Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve menu items",
    });
  }
};

// 3. Get a single approved menu item
export const getApprovedMenuItemById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const menuItem = await menuItemCollection.findOne({
      _id: new ObjectId(id),
      status: "approved",
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item retrieved successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Get Menu Item Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve menu item",
    });
  }
};

// 4. Get all menu items created by the logged-in vendor
export const getVendorMenuItems = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can access their menu items",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const menuItems = await menuItemCollection
      .find({ vendorId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Vendor menu items retrieved successfully",
      data: menuItems,
    });
  } catch (error) {
    console.error("Get Vendor Menu Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve vendor menu items",
    });
  }
};

// 5. Update a menu item (Vendor only)
export const updateMenuItem = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can update menu items",
      });
    }

    const id = req.params.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const parsed = updateMenuItemValidationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    if (Object.keys(parsed.data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const result = await menuItemCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        vendorId: user.id,
      },
      {
        $set: {
          ...parsed.data,
          status: "pending",
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found or you are not the owner",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Menu item updated successfully. Waiting for admin approval.",
      data: result,
    });
  } catch (error) {
    console.error("Update Menu Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update menu item",
    });
  }
};

// 6. Delete a menu item (Vendor only)
export const deleteMenuItem = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can delete menu items",
      });
    }

    const id = req.params.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const result = await menuItemCollection.deleteOne({
      _id: new ObjectId(id),
      vendorId: user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found or you are not the owner",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Menu Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
    });
  }
};

// 7. Get all menu items for Admin
export const getAllMenuItemsForAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access all menu items",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const menuItems = await menuItemCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "All menu items retrieved successfully",
      data: menuItems,
    });
  } catch (error) {
    console.error("Get All Menu Items Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve all menu items",
    });
  }
};

// 8. Approve or Reject a menu item (Admin only)
export const updateMenuItemApproval = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can approve or reject menu items",
      });
    }

    const id = req.params.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    // Find the pending menu item
    const menuItem = await menuItemCollection.findOne({
      _id: new ObjectId(id),
      status: "pending",
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Pending menu item not found",
      });
    }

    // Check Vendor plan before approval
    if (status === "approved") {
      const db = await connectDB();

      const userCollection =
        db.collection<BetterAuthUser>("user");

      const vendor = await userCollection.findOne({
        _id: ObjectId.isValid(menuItem.vendorId)
          ? new ObjectId(menuItem.vendorId)
          : menuItem.vendorId,
      });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor account not found",
        });
      }

      const isPremium =
        vendor.subscriptionPlan === "premium" &&
        (
          !vendor.subscriptionExpiresAt ||
          new Date(vendor.subscriptionExpiresAt).getTime() >
            Date.now()
        );

      if (!isPremium) {
        const approvedCount =
          await menuItemCollection.countDocuments({
            vendorId: menuItem.vendorId,
            status: "approved",
          });

        if (approvedCount >= 3) {
          return res.status(403).json({
            success: false,
            message:
              "Free vendors can have a maximum of 3 approved menu items. Upgrade to Premium for unlimited items.",
          });
        }
      }
    }

    // Update approval status
    const result = await menuItemCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Pending menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Menu item ${status} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Menu Item Approval Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update menu item approval",
    });
  }
};