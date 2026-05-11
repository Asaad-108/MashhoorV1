import api from "./client";

// ─── Outreach ─────────────────────────────────────────────────────────────────

export type OutreachStatus = "pending" | "sent" | "opened" | "replied" | "accepted" | "rejected";
export type SentimentLabel = "positive" | "neutral" | "negative";

export type Outreach = {
  _id: string;
  campaign: { _id: string; title: string; description: string; budget: object; timeline: object };
  business: { _id: string; name: string; email: string; avatar?: string };
  influencer: { _id: string; name: string; email: string; avatar?: string };
  message: string;
  isAiGenerated: boolean;
  status: OutreachStatus;
  influencerReply?: string;
  sentiment?: { label: SentimentLabel; score: number; analyzedAt: string };
  createdAt: string;
};

export const outreachApi = {
  send: async (
    campaignId: string,
    influencerId: string,
    message: string,
    isAiGenerated = false
  ): Promise<Outreach> => {
    const { data } = await api.post("/outreach", { campaignId, influencerId, message, isAiGenerated });
    return data.data;
  },

  getByCampaign: async (campaignId: string): Promise<Outreach[]> => {
    const { data } = await api.get(`/outreach/campaign/${campaignId}`);
    return data.data;
  },

  getMyRequests: async (status?: OutreachStatus): Promise<Outreach[]> => {
    const { data } = await api.get("/outreach/my-requests", {
      params: status ? { status } : {},
    });
    return data.data;
  },

  reply: async (outreachId: string, reply: string, accept?: boolean): Promise<Outreach> => {
    const { data } = await api.put(`/outreach/${outreachId}/reply`, { reply, accept });
    return data.data;
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export type Message = {
  _id: string;
  sender: { _id: string; name: string; avatar?: string };
  receiver: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type Conversation = {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }>;
  campaign?: { _id: string; title: string };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: Record<string, number>;
};

export const messageApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get("/messages/conversations");
    return data.data;
  },

  getMessages: async (conversationId: string, page = 1): Promise<Message[]> => {
    const { data } = await api.get(`/messages/${conversationId}`, {
      params: { page },
    });
    return data.data;
  },

  send: async (receiverId: string, content: string, campaignId?: string): Promise<Message> => {
    const { data } = await api.post("/messages/send", {
      receiverId,
      content,
      campaignId,
    });
    return data.data;
  },
};
