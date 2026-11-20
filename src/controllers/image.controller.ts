
import { Request, Response } from "express";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Multer configuration
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
  },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error("Only JPEG, PNG, and WebP images are allowed")
      );
    }
  },
});

// Upload image to ImgBB
export const uploadImage = async (
  req: Request,
  res: Response
) => {
  try {
    // Check if image exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload",
      });
    }

    // Get ImgBB API key
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "ImgBB API key is not configured",
      });
    }

    // Prepare image data
    const formData = new FormData();

    const imageBlob = new Blob(
      [new Uint8Array(req.file.buffer)],
      {
        type: req.file.mimetype,
      }
    );

    formData.append(
      "image",
      imageBlob,
      req.file.originalname
    );

    // Upload image to ImgBB
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    // Handle ImgBB errors
    if (!response.ok || !result.success) {
      console.error("ImgBB Upload Error:", result);

      return res.status(502).json({
        success: false,
        message: "Image upload to ImgBB failed",
      });
    }

    // Successful response
    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.data.url,
        displayUrl: result.data.display_url,
      },
    });

  } catch (error) {
    console.error("Image Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};
