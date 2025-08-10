import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageSeen,
  sendMessage,
  deleteMessage,
  upload,
  processUpload
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post(
  "/:id",
  protectRoute,
  upload.single('image'),
  processUpload,
  sendMessage
);

router.put("/mark/:id", protectRoute, markMessageSeen);
router.delete("/:id", protectRoute, deleteMessage);

export default router;