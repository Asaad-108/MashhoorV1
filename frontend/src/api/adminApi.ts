import api from "./client";

export type AdminStats = {
  totalInfluencers: number;
  totalBusinesses: number;
  totalCampaigns: number;
  activeCampaigns: number;
  pendingVerification: number;
  totalOutreach: number;
  pendingOutreach: number;
  recentActivity: {
    id: string;
    type: "user" | "campaign" | "verification" | "report" | "system";
    text: string;
    time: string;
  }[];
};

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get("/admin/stats");
    return data.data;
  },
};
