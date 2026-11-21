
import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { getOrderCollection } from "../models/order.model.js";
import { getMenuItemCollection } from "../models/menuItem.model.js";

import {
  orderValidationSchema,
  updateOrderStatusSchema,
} from "../utils/order.validation.js";

interface AuthenticatedUser {
  id: string;
  role: "customer" | "vendor" | "admin";
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// 1. Create a new order (Customer only)
export const createOrder = async (
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

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can place orders",
      });
    }

    const parsed = orderValidationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      itemId,
      deliveryDate,
      deliveryAddress,
      message,
    } = parsed.data;

    if (!ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const menuItemCollection = await getMenuItemCollection();

    const menuItem = await menuItemCollection.findOne({
      _id: new ObjectId(itemId),
      status: "approved",
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Approved menu item not found",
      });
    }

    // Prevent vendors from ordering their own menu items.
    if (String(menuItem.vendorId) === user.id) {
      return res.status(403).json({
        success: false,
        message: "Vendors cannot order their own menu items",
      });
    }

    const orderCollection = await getOrderCollection();

    // Normalize delivery date to UTC midnight.
    const normalizedDeliveryDate = new Date(deliveryDate);
    normalizedDeliveryDate.setUTCHours(0, 0, 0, 0);

    // Prevent duplicate active orders for the same
    // customer, menu item, and delivery date.
    const existingOrder = await orderCollection.findOne({
      customerId: user.id,
      itemId: new ObjectId(itemId),
      deliveryDate: normalizedDeliveryDate,
      status: {
        $in: ["pending", "accepted"],
      },
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active order for this item on this delivery date",
      });
    }

    const newOrder = {
      itemId: new ObjectId(itemId),
      vendorId: menuItem.vendorId,
      customerId: user.id,
      deliveryDate: normalizedDeliveryDate,
      deliveryAddress,
      message: message || "",
      status: "pending" as const,
      statusHistory: [
        {
          status: "pending" as const,
          timestamp: new Date(),
          note: "Order placed by customer",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await orderCollection.insertOne(newOrder);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        _id: result.insertedId,
        ...newOrder,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

// 2. Get customer's own orders
export const getCustomerOrders = async (
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

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access this resource",
      });
    }

    const orderCollection = await getOrderCollection();

    const orders = await orderCollection
      .aggregate([
        {
          $match: {
            customerId: user.id,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "menuItems",
            localField: "itemId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        {
          $unwind: {
            path: "$menuItem",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Customer orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Get Customer Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer orders",
    });
  }
};

// 3. Get vendor's incoming orders
export const getVendorOrders = async (
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
        message: "Only vendors can access this resource",
      });
    }

    const orderCollection = await getOrderCollection();

    const orders = await orderCollection
      .aggregate([
        {
          $match: {
            vendorId: user.id,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "menuItems",
            localField: "itemId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        {
          $unwind: {
            path: "$menuItem",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Vendor orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Get Vendor Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve vendor orders",
    });
  }
};

// 4. Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const id = req.params.id;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (user.role !== "customer" && user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update orders",
      });
    }

    const parsed = updateOrderStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { status } = parsed.data;
    const orderCollection = await getOrderCollection();

    const statusNotes: Record<string, string> = {
      accepted: "Order accepted by restaurant",
      rejected: "Order rejected by restaurant",
      cancelled: "Order cancelled by customer",
    };

    const updateData: any = {
      $set: {
        status,
        updatedAt: new Date(),
      },
      $push: {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: statusNotes[status] || `Order marked as ${status}`,
        },
      },
    };

    let result;

    if (user.role === "customer") {
      if (status !== "cancelled") {
        return res.status(403).json({
          success: false,
          message: "Customers can only cancel orders",
        });
      }

      result = await orderCollection.updateOne(
        {
          _id: new ObjectId(id),
          customerId: user.id,
          status: "pending",
        },
        updateData
      );
    } else {
      if (status !== "accepted" && status !== "rejected") {
        return res.status(403).json({
          success: false,
          message: "Vendors can only accept or reject orders",
        });
      }

      result = await orderCollection.updateOne(
        {
          _id: new ObjectId(id),
          vendorId: user.id,
          status: "pending",
        },
        updateData
      );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found, not owned by you, or no longer pending",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

// 5. Get all orders (Admin only)
export const getAllOrdersForAdmin = async (
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
        message: "Only admins can access all orders",
      });
    }

    const orderCollection = await getOrderCollection();

    const orders = await orderCollection
      .aggregate([
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "menuItems",
            localField: "itemId",
            foreignField: "_id",
            as: "menuItem",
          },
        },
        {
          $unwind: {
            path: "$menuItem",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      message: "All orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Admin Get Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve all orders",
    });
  }
};

