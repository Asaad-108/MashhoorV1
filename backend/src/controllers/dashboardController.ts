import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../types";
import { Campaign } from "../models/Campaign";
import { Outreach } from "../models/Outreach";
import { InfluencerProfile, IInfluencerProfile } from "../models/InfluencerProfile";
import { AppError } from "../middleware/errorHandler";
import { calculateTrustScore } from "../services/trustScoreService";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getLast6Months = () =>
  Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: months[d.getMonth()], year: d.getFullYear(), numericMonth: d.getMonth() };
  });

const toBusinessId = (userId: string) => new mongoose.Types.ObjectId(userId);

const toTimestamp = (value: Date | string | undefined) =>
  value ? new Date(value).getTime() : 0;

/** Refresh YouTube stats for seeded demo accounts (@youtube.test emails). */
async function syncYouTubeStatsIfSeeded(profile: IInfluencerProfile): Promise<void> {
  const user = profile.user as { email?: string } | undefined;
  if (!user?.email?.endsWith("@youtube.test")) return;

  const channelId = user.email.split("@")[0];
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) return;

  try {
    let statsURL = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`;
    let statsRes = await fetch(statsURL);
    let statsData = (await statsRes.json()) as { items?: Array<{ statistics: Record<string, string>; snippet: { title: string; description?: string } }> };
    let channelData = statsData.items?.[0];

    if (!channelData && profile.platforms?.youtube?.handle) {
      const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(profile.platforms.youtube.handle)}&maxResults=1&key=${API_KEY}`;
      const searchRes = await fetch(searchURL);
      const searchData = (await searchRes.json()) as { items?: Array<{ snippet: { channelId: string } }> };
      const realChannelId = searchData.items?.[0]?.snippet.channelId;
      if (realChannelId) {
        statsURL = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${realChannelId}&key=${API_KEY}`;
        statsRes = await fetch(statsURL);
        statsData = (await statsRes.json()) as typeof statsData;
        channelData = statsData.items?.[0];
      }
    }

    if (!channelData) return;

    const subs = parseInt(channelData.statistics.subscriberCount || "0", 10);
    const views = parseInt(channelData.statistics.viewCount || "0", 10);
    const videoCount = parseInt(channelData.statistics.videoCount || "0", 10);
    const avgViews = Math.floor(views / (videoCount || 1)) || 0;
    const engagementRate = Math.min(100, Number(((avgViews / (subs || 1)) * 100).toFixed(2)));

    if (!profile.platforms.youtube) {
      profile.platforms.youtube = { handle: "", subscribers: 0, avgViews: 0, engagementRate: 0 };
    }
    profile.platforms.youtube.subscribers = subs;
    profile.platforms.youtube.avgViews = avgViews;
    profile.platforms.youtube.engagementRate = engagementRate;
    profile.platforms.youtube.handle = channelData.snippet.title;
    profile.totalFollowers = subs;
    profile.avgEngagementRate = engagementRate;
    if (channelData.snippet.description) {
      profile.bio = channelData.snippet.description.substring(0, 490);
    }
    await profile.save();
  } catch (err) {
    console.error("Dashboard YouTube sync failed:", err);
  }
}

export const getInfluencerDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return next(new AppError("User ID missing", 400));

    let profile = await InfluencerProfile.findOne({ user: userId }).populate("user", "name email avatar");

    if (!profile) {
      profile = await InfluencerProfile.create({
        user: userId,
        niche: ["Unspecified"],
        location: "",
        country: "",
        bio: "",
        platforms: {},
      });
      await profile.populate("user", "name email avatar");
    }

    await syncYouTubeStatsIfSeeded(profile);

    const { score, breakdown } = await calculateTrustScore(profile);
    profile.trustScore = score;
    profile.trustScoreBreakdown = breakdown;
    await profile.save();

    const last6Months = getLast6Months();
    const earningsByMonth = last6Months.map((m) => ({ month: m.month, amount: 0 }));

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
        trustScore: profile.trustScore,
        recentCampaigns,
        earningsByMonth,
        profileAnalytics: {
          totalFollowers: profile.totalFollowers,
          avgEngagementRate: profile.avgEngagementRate,
          platforms: profile.platforms,
          trustScoreBreakdown: profile.trustScoreBreakdown,
          niche: profile.niche,
          isVerified: profile.isVerified,
        },
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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const businessId = toBusinessId(userId);

    // Total campaigns
    const totalCampaigns = await Campaign.countDocuments({ business: businessId });

    // Influencers contacted
    const influencersContacted = await Outreach.countDocuments({ business: businessId });

    // Shortlisted / Accepted
    const shortlisted = await Outreach.countDocuments({
      business: businessId,
      status: { $in: ["accepted", "replied"] },
    });

    // Recent campaigns for dashboard list
    const recentCampaignsList = await Campaign.find({ business: businessId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status createdAt budget progress");

    // Recent Activity (Campaign creations and Outreaches)
    const recentCampaigns = recentCampaignsList.slice(0, 2);
      
    const recentOutreaches = await Outreach.find({ business: businessId })
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
    ]
      .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
      .slice(0, 5);

    // ─── Real-Time Charts Data Aggregation ───
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: months[d.getMonth()], year: d.getFullYear(), numericMonth: d.getMonth() };
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Campaign Activity
    const campaignsLast6Months = await Campaign.find({
      business: businessId,
      createdAt: { $gte: sixMonthsAgo },
    });

    const campaignActivity = last6Months.map(m => {
      const count = campaignsLast6Months.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === m.numericMonth && d.getFullYear() === m.year;
      }).length;
      return { month: m.month, count };
    });

    // Engagement Trend
    const outreachesLast6Months = await Outreach.find({
      business: businessId,
      status: { $in: ["accepted", "replied"] },
      updatedAt: { $gte: sixMonthsAgo },
    }).populate("influencer", "_id");

    const influencerIds = outreachesLast6Months
      .map((o) => {
        const inf = o.influencer as mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId };
        if (inf && typeof inf === "object" && "_id" in inf && inf._id) return inf._id;
        return inf as mongoose.Types.ObjectId;
      })
      .filter(Boolean);
    const influencerProfiles = await InfluencerProfile.find({ user: { $in: influencerIds } });

    const engagementMap = new Map();
    influencerProfiles.forEach(p => {
      engagementMap.set(p.user.toString(), p.avgEngagementRate || 0);
    });

    let totalEngagement = 0;
    let engagementCount = 0;

    const engagementTrend = last6Months.map(m => {
      const outreachesInMonth = outreachesLast6Months.filter(o => {
        const d = new Date(o.updatedAt);
        return d.getMonth() === m.numericMonth && d.getFullYear() === m.year;
      });

      let monthTotal = 0;
      let monthCount = 0;

      outreachesInMonth.forEach((o) => {
        const inf = o.influencer as mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId };
        const infId =
          inf && typeof inf === "object" && "_id" in inf && inf._id
            ? inf._id.toString()
            : (inf as mongoose.Types.ObjectId)?.toString?.() ?? "";
        const rate = engagementMap.get(infId) || 0;
        monthTotal += rate;
        monthCount++;
        totalEngagement += rate;
        engagementCount++;
      });

      return {
        month: m.month,
        rate: monthCount > 0 ? Number((monthTotal / monthCount).toFixed(1)) : 0
      };
    });

    const avgEngagement = engagementCount > 0 ? Number((totalEngagement / engagementCount).toFixed(1)) + "%" : "0.0%";

    res.status(200).json({
      success: true,
      data: {
        totalCampaigns,
        influencersContacted,
        shortlisted,
        avgEngagement,
        recentActivity,
        recentCampaigns: recentCampaignsList,
        campaignActivity,
        engagementTrend,
      },
    });
  } catch (err) {
    next(err);
  }
};
