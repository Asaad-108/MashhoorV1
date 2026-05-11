import api from "./client";

export const getInfluencerDashboardStats = async () => {
  const response = await api.get("/dashboard/influencer");
  return response.data;
};

export const getBusinessDashboardStats = async () => {
  const response = await api.get("/dashboard/business");
  return response.data;
};
