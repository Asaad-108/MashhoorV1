import { Response, NextFunction } from "express";
import { User } from "../models/User";
import { Campaign } from "../models/Campaign";
import { Outreach } from "../models/Outreach";
import { AuthRequest } from "../types";

// GET /api/admin/stats
export const getAdminStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    void req;
    const [
      totalInfluencers,
      totalBusinesses,
      totalCampaigns,
      activeCampaigns,
      pendingVerification,
      totalOutreach,
      pendingOutreach,
      recentUsers,
      recentCampaigns,
    ] = await Promise.all([
      User.countDocuments({ role: "influencer" }),
      User.countDocuments({ role: "business" }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: "active" }),
      User.countDocuments({ role: "influencer", isVerified: false }),
      Outreach.countDocuments(),
      Outreach.countDocuments({ status: "pending" }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name role createdAt"),
      Campaign.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status createdAt")
        .populate("business", "name"),
    ]);

    const recentActivity = [
      ...recentUsers.map((u) => ({
        id: u._id.toString(),
        type: "user" as const,
        text: `New ${u.role} registered: ${u.name}`,
        time: u.createdAt,
      })),
      ...recentCampaigns.map((c) => ({
        id: c._id.toString(),
        type: "campaign" as const,
        text: `Campaign created: ${c.title}`,
        time: c.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8)
      .map((item) => ({
        ...item,
        time: formatRelativeTime(new Date(item.time)),
      }));

    res.status(200).json({
      success: true,
      data: {
        totalInfluencers,
        totalBusinesses,
        totalCampaigns,
        activeCampaigns,
        pendingVerification,
        totalOutreach,
        pendingOutreach,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
