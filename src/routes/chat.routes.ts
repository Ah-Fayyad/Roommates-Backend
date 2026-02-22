import express from "express";
import {
  getChats,
  getMessages,
  createChat,
} from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = express.Router();

router.use(authenticate);
router.post("/", createChat);
router.get("/", getChats);
router.get("/:chatId/messages", getMessages);
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  let url: string;
  if (req.file.path.startsWith("http")) {
    url = req.file.path;
  } else {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    url = `${backendUrl}/uploads/${req.file.filename}`;
  }

  res.json({ url });
});

export default router;
