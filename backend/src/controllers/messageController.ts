import { Response, NextFunction } from "express";
import { Message, Conversation } from "../models/Message";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../types";
import mongoose from "mongoose";

// GET /api/messages/conversations
export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.userId);

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email avatar role")
      .populate("campaign", "title")
      .sort({ lastMessageAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/:conversationId
export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const convo = await Conversation.findById(req.params.conversationId);
    if (!convo) return next(new AppError("Conversation not found", 404));

    const isParticipant = convo.participants.some(
      (p) => p.toString() === req.user?.userId
    );
    if (!isParticipant) return next(new AppError("Not authorized", 403));

    const messages = await Message.find({
      $or: [
        { sender: convo.participants[0], receiver: convo.participants[1] },
        { sender: convo.participants[1], receiver: convo.participants[0] },
      ],
    })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Mark as read
    await Message.updateMany(
      { receiver: req.user?.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    convo.unreadCount.set(req.user!.userId, 0);
    await convo.save();

    res.status(200).json({
      success: true,
      data: messages.reverse(), // chronological order
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/messages/send
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { receiverId, content, campaignId } = req.body;
    if (!receiverId || !content) {
      return next(new AppError("receiverId and content are required", 400));
    }

    const senderId = new mongoose.Types.ObjectId(req.user?.userId);
    const receiverObjId = new mongoose.Types.ObjectId(receiverId);

    // Find or create conversation
    let convo = await Conversation.findOne({
      participants: { $all: [senderId, receiverObjId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [senderId, receiverObjId],
        ...(campaignId ? { campaign: campaignId } : {}),
        unreadCount: {},
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverObjId,
      content,
      ...(campaignId ? { campaign: campaignId } : {}),
    });

    // Update conversation metadata
    convo.lastMessage = content;
    convo.lastMessageAt = new Date();
    const receiverUnread = convo.unreadCount.get(receiverId) ?? 0;
    convo.unreadCount.set(receiverId, receiverUnread + 1);
    await convo.save();

    const populated = await message.populate("sender", "name avatar");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
