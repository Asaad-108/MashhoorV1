import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { Campaign } from "../models/Campaign";
import { Outreach } from "../models/Outreach";
import { InfluencerProfile } from "../models/InfluencerProfile";
import { AppError } from "../middleware/errorHandler";

export const getInfluencerDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return next(new AppError("User ID missing", 400));

    // Get influencer profile for trust score
    const profile = await InfluencerProfile.findOne({ user: userId });

    // Active campaigns (where influencer is selected and campaign is active)
    const activeCampaignsCount = await Campaign.countDocuments({
      selectedInfluencers: userId,
      status: "active",
    });

    // Pending requests (outreach directed to this influencer)
    const pendingRequestsCount = await Outreach.countDocuments({
      influencer: userId,
      status: { $in: ["pending", "sent"] },
    });

    // Recent active campaigns for the list
    const recentCampaigns = await Campaign.find({
      selectedInfluencers: userId,
      status: { $in: ["active", "completed"] },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("business", "name");

    // Total earnings (simplified: 0 for now until payment model is built)
    const totalEarnings = 0;

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        activeCampaigns: activeCampaignsCount,
        pendingRequests: pendingRequestsCount,
        trustScore: profile?.trustScore || 0,
        recentCampaigns,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getBusinessDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return next(new AppError("User ID missing", 400));

    // Total campaigns
    const totalCampaigns = await Campaign.countDocuments({ business: userId });

    // Influencers contacted
    const influencersContacted = await Outreach.countDocuments({ business: userId });

    // Shortlisted / Accepted
    const shortlisted = await Outreach.countDocuments({
      business: userId,
      status: { $in: ["accepted", "replied"] },
    });

    // Recent Activity (Campaign creations and Outreaches)
    const recentCampaigns = await Campaign.find({ business: userId })
      .sort({ createdAt: -1 })
      .limit(2);
      
    const recentOutreaches = await Outreach.find({ business: userId })
      .sort({ updatedAt: -1 })
      .limit(4)
      .populate("influencer", "name");

    // Format recent activity
    const recentActivity = [
      ...recentCampaigns.map(c => ({
        id: c._id,
        type: "campaign",
        text: `Campaign '${c.title}' created`,
        date: c.createdAt,
      })),
      ...recentOutreaches.map((o: any) => {
        let text = `Contacted @${o.influencer?.name || "influencer"} for collaboration`;
        let type = "contact";
        
        if (o.status === "accepted") {
          text = `@${o.influencer?.name || "influencer"} accepted your campaign request!`;
          type = "Approvals";
        } else if (o.status === "rejected") {
          text = `@${o.influencer?.name || "influencer"} declined your request.`;
          type = "Messages";
        } else if (o.status === "replied") {
          text = `New message from @${o.influencer?.name || "influencer"}`;
          type = "Messages";
        }

        return {
          id: o._id.toString() + o.status, // unique id based on status change
          type,
          text,
          date: o.updatedAt,
        };
      })
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        influencersContacted,
        shortlisted,
        avgEngagement: "0.0%", // Placeholder until real computation is needed
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};
