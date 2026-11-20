
import { Router } from "express";

import {
  upload,
  uploadImage,
} from "../controllers/image.controller.js";

import {
  authenticateUser,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Only authenticated vendors can upload images
router.post(
  "/upload",
  authenticateUser,
  authorizeRoles("vendor"),
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message:
            error.message || "Image upload validation failed",
        });
      }

      next();
    });
  },
  uploadImage
);

export default router;
