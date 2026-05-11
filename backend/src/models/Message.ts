import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  campaign?: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Conversation = a unique pair (sorted) of sender+receiver
export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];  // always 2
  campaign?: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>;         // userId -> unread count
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign" },
    content: { type: String, required: true, maxlength: 2000 },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign" },
    lastMessage: String,
    lastMessageAt: Date,
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
