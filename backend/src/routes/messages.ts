import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/messageController";
import { protect } from "../middleware/auth";

const router = Router();

// ⚠️  FIXED: /conversations and /send MUST come before /:conversationId
// otherwise Express matches them as conversation ids

router.get("/conversations", protect, getConversations);
router.post("/send", protect, sendMessage);

// Parameterized route LAST
router.get("/:conversationId", protect, getMessages);

export default router;
