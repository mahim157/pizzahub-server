
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

// 2. Get approved menu items with search, filters and sorting
export const getApprovedMenuItems = async (
  req: Request,
  res: Response
) => {
  try {
    const menuItemCollection = await getMenuItemCollection();

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : "";

    const location =
      typeof req.query.location === "string"
        ? req.query.location.trim()
        : "";

    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort.trim()
        : "";

    // Allowed categories
    const allowedCategories = [
      "Classic Pizzas",
      "Vegetarian Pizzas",
      "Meat Lovers",
      "Specialty / Gourmet Pizzas",
      "Sides & Appetizers",
      "Beverages & Desserts",
    ];

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu category",
      });
    }

    // Validate sorting option
    if (sort && !["price_asc", "price_desc"].includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Sort must be price_asc or price_desc",
      });
    }

    // Escape special regex characters
    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Only approved items are publicly visible
    const filter: Record<string, any> = {
      status: "approved",
    };

    // Search by item name
    if (search) {
      filter.itemName = {
        $regex: escapeRegex(search),
        $options: "i",
      };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by area or city
    if (location) {
      const locationRegex = {
        $regex: escapeRegex(location),
        $options: "i",
      };

      filter.$or = [
        { "location.area": locationRegex },
        { "location.city": locationRegex },
      ];
    }

    // Sorting
    let sortOption: Record<string, 1 | -1> = {
      createdAt: -1,
    };

    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    const menuItems = await menuItemCollection
      .find(filter)
      .sort(sortOption)
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Menu items retrieved successfully",
      total: menuItems.length,
      filters: {
        search: search || null,
        category: category || null,
        location: location || null,
        sort: sort || "latest",
      },
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
        vendor.subscriptionExpiresAt != null &&
        new Date(vendor.subscriptionExpiresAt).getTime() >
          Date.now();

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

// 9. Add or update review & rating for a menu item (Customer only)
export const addMenuItemReview = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (user.role !== "customer") {
      return res.status(403).json({ success: false, message: "Only customers can submit reviews" });
    }

    const id = String(req.params.id || "");
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid menu item ID" });
    }

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }
    if (!comment) {
      return res.status(400).json({ success: false, message: "Review comment is required" });
    }

    const menuItemCollection = await getMenuItemCollection();
    const item = await menuItemCollection.findOne({ _id: new ObjectId(id), status: "approved" });

    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    const existingReviews = Array.isArray((item as any).reviews) ? (item as any).reviews : [];
    const filteredReviews = existingReviews.filter(
      (r: any) => String(r.customerId) !== String(user.id)
    );

    const newReview = {
      customerId: String(user.id),
      customerName: (user as { name?: string; email?: string }).name || user.email || "Pizza Lover",
      rating,
      comment,
      createdAt: new Date(),
    };

    const updatedReviews = [newReview, ...filteredReviews];
    const totalReviews = updatedReviews.length;
    const averageRating = Number(
      (updatedReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
    );

    await menuItemCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          reviews: updatedReviews,
          averageRating,
          totalReviews,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Review submitted successfully!",
      data: { reviews: updatedReviews, averageRating, totalReviews },
    });
  } catch (error) {
    console.error("Add Review Error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

// 10. Toggle favorite menu item for logged-in user
export const toggleFavoriteMenuItem = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const id = String(req.params.id || "");
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid menu item ID" });
    }

    const db = await connectDB();
    const userCollection = db.collection("user");
    const userQuery = ObjectId.isValid(String(user.id))
      ? { $or: [{ _id: new ObjectId(String(user.id)) }, { id: String(user.id) }] }
      : { id: String(user.id) };

    const dbUser = await userCollection.findOne(userQuery);
    const currentFavorites: string[] = Array.isArray(dbUser?.favorites)
      ? dbUser.favorites.map(String)
      : [];

    const exists = currentFavorites.includes(id);
    const updatedFavorites = exists
      ? currentFavorites.filter((favId) => favId !== id)
      : [...currentFavorites, id];

    await userCollection.updateOne(userQuery, {
      $set: { favorites: updatedFavorites, updatedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: exists ? "Removed from favorites" : "Added to favorites",
      data: { isFavorite: !exists, favorites: updatedFavorites },
    });
  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update favorites" });
  }
};

// 11. Get logged-in user's favorite menu items
export const getMyFavoriteMenuItems = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const db = await connectDB();
    const userCollection = db.collection("user");
    const userQuery = ObjectId.isValid(String(user.id))
      ? { $or: [{ _id: new ObjectId(String(user.id)) }, { id: String(user.id) }] }
      : { id: String(user.id) };

    const dbUser = await userCollection.findOne(userQuery);
    const favoriteIds: string[] = Array.isArray(dbUser?.favorites)
      ? dbUser.favorites.filter((fid: string) => ObjectId.isValid(fid))
      : [];

    if (favoriteIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        favoriteIds: [],
      });
    }

    const menuItemCollection = await getMenuItemCollection();
    const items = await menuItemCollection
      .find({
        _id: { $in: favoriteIds.map((fid) => new ObjectId(fid)) },
        status: "approved",
      })
      .toArray();

    return res.status(200).json({
      success: true,
      data: items,
      favoriteIds,
    });
  } catch (error) {
    console.error("Get Favorites Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch favorites" });
  }
};

