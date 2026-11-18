
import { Router } from "express";
import {
  getApprovedMenuItems,
  getApprovedMenuItemById,
} from "../controllers/menuItem.controller.js";

const router = Router();

// Get all approved menu items
router.get("/", getApprovedMenuItems);

// Get a single approved menu item
router.get("/:id", getApprovedMenuItemById);

export default router;
