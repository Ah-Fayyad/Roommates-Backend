import express from "express";
import { upload } from "../middleware/upload.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

// Upload single image (requires authentication)
router.post("/image", authenticate, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let url: string;
  if (req.file.path.startsWith("http")) {
    url = req.file.path;
  } else {
    url = `/uploads/${req.file.filename}`;
  }

  console.log(`📸 Image uploaded by user ${(req as any).user?.id}: ${url}`);
  res.json({ url });
});

// Upload multiple images (requires authentication)
router.post("/images", authenticate, upload.array("images", 5), (req, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const files = req.files as Express.Multer.File[];

  const urls = files.map((file) => {
    if (file.path.startsWith("http")) {
      return file.path;
    } else {
      return `/uploads/${file.filename}`;
    }
  });

  console.log(
    `📸 ${urls.length} images uploaded by user ${(req as any).user?.id}:`,
    urls,
  );
  res.json({ urls });
});

export default router;
