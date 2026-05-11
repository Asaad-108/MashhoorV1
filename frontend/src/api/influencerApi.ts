import api from "./client";

export type InfluencerPlatforms = {
  instagram?: { handle: string; followers: number; engagementRate: number };
  youtube?: { handle: string; subscribers: number; avgViews: number };
  tiktok?: { handle: string; followers: number; engagementRate: number };
};

export type InfluencerProfile = {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: string };
  niche: string[];
  location: string;
  country: string;
  bio: string;
  platforms: InfluencerPlatforms;
  trustScore: number;
  trustScoreBreakdown: {
    engagementAuthenticity: number;
    followerQuality: number;
    contentConsistency: number;
    collaborationHistory: number;
  };
  isVerified: boolean;
  tags: string[];
  totalFollowers: number;
  avgEngagementRate: number;
};

export type InfluencerFilters = {
  niche?: string;
  country?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minTrustScore?: number;
  minEngagement?: number;
  sort?: "trustScore" | "followers" | "engagement" | "newest";
  search?: string;
  page?: number;
  limit?: number;
};

export type PaginatedInfluencers = {
  data: InfluencerProfile[];
  pagination: { total: number; page: number; limit: number; pages: number };
};

export const influencerApi = {
  getAll: async (filters: InfluencerFilters = {}): Promise<PaginatedInfluencers> => {
    const { data } = await api.get("/influencers", { params: filters });
    return data;
  },

  getById: async (userId: string): Promise<InfluencerProfile> => {
    const { data } = await api.get(`/influencers/${userId}`);
    return data.data;
  },

  updateMyProfile: async (
    updates: Partial<Omit<InfluencerProfile, "_id" | "user" | "trustScore" | "totalFollowers" | "avgEngagementRate">>
  ): Promise<InfluencerProfile> => {
    const { data } = await api.put("/influencers/profile", updates);
    return data.data;
  },
};
