import { Response, NextFunction } from "express";
import { InfluencerProfile } from "../models/InfluencerProfile";
import { User } from "../models/User";
import { Campaign } from "../models/Campaign";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../types";
import { calculateTrustScore } from "../services/trustScoreService";
import { categorizeInfluencersByNiche, predictCampaignROIWithML } from "../services/mlService";
import { getYouTubeApiKey } from "../config/youtube";
import { syncYouTubeForProfile } from "../services/youtubeSyncService";
import { syncInstagramForProfile } from "../services/instagramSyncService";
import {
  getCampaignReachForROI,
  getUnifiedPlatformMetrics,
} from "../services/platformMetricsService";

// GET /api/influencers
// Query params: niche, country, minFollowers, maxFollowers, minTrustScore, minEngagement, page, limit, sort
export const getInfluencers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      niche,
      country,
      platform,
      minFollowers = "0",
      maxFollowers,
      minTrustScore = "0",
      minEngagement = "0",
      page = "1",
      limit = "12",
      sort = "trustScore",
      search,
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (platform === "instagram") {
      filter["platforms.instagram.handle"] = { $exists: true, $ne: "" };
    } else if (platform === "youtube") {
      filter["platforms.youtube.handle"] = { $exists: true, $ne: "" };
    }

    if (niche) filter.niche = { $in: niche.split(",") };
    if (country && country.trim()) {
      filter.$or = [
        { country: { $regex: country.trim(), $options: "i" } },
        { country: { $in: ["", null] } },
        { location: { $regex: country.trim(), $options: "i" } },
      ];
    }
    if (minFollowers) filter.totalFollowers = { $gte: Number(minFollowers) };
    if (maxFollowers)
      filter.totalFollowers = {
        ...(filter.totalFollowers as object),
        $lte: Number(maxFollowers),
      };
    if (minTrustScore) filter.trustScore = { $gte: Number(minTrustScore) };
    if (minEngagement)
      filter.avgEngagementRate = { $gte: Number(minEngagement) };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      trustScore: { trustScore: -1, _id: 1 },
      followers: { totalFollowers: -1, _id: 1 },
      engagement: { avgEngagementRate: -1, _id: 1 },
      newest: { createdAt: -1, _id: 1 },
    };
    const sortObj = sortMap[sort] ?? { trustScore: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: "i" },
        role: "influencer"
      }).select("_id");
      filter.user = { $in: matchingUsers.map((u) => u._id) };
    }

    let query = InfluencerProfile.find(filter)
      .populate({
        path: "user",
        select: "name email avatar hasSignedUp",
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    let [profiles, total] = await Promise.all([
      query,
      InfluencerProfile.countDocuments(filter),
    ]);

    // If completely empty, fetch realtime data (seed from YouTube) and then re-query
    if (total === 0 && Object.keys(filter).length <= 2) { // Allow empty filter or just page/limit defaults
        try {
            const { seedData } = await import("../seedYouTube");
            await seedData();
            
            // Re-query after seeding
            profiles = await InfluencerProfile.find(filter)
              .populate({
                path: "user",
                select: "name email avatar hasSignedUp",
              })
              .sort(sortObj)
              .skip(skip)
              .limit(limitNum);
            total = await InfluencerProfile.countDocuments(filter);
        } catch (seedErr) {
            console.error("Error auto-seeding YouTube data:", seedErr);
        }
    }

    // Filter out nulls (e.g. if the associated user was deleted)
    const filtered = profiles.filter((p) => p.user !== null);

    // Automatically update Trust Scores in real-time for all cards
    const updatedFiltered = await Promise.all(
      filtered.map(async (profile) => {
        try {
          // Fetch real-time data from APIs
          const user = profile.user as any;
          const userEmail = user?.email;
          
          // We no longer live-sync YouTube on the list view to save API Quota and improve load speeds.
          // Data is now purely served from the database cache.
          // if (userEmail && userEmail.endsWith("@youtube.test")) {
          //   await syncYouTubeForProfile(profile, userEmail);
          // } 
          // Note: Instagram sync is deliberately skipped here because Apify actor calls take 15-30s per profile,
          // which would cause the entire Find Influencers screen to freeze for minutes. 
          // Instagram data is populated via the seed script instead.

          const { score, breakdown } = await calculateTrustScore(profile);
          profile.trustScore = score;
          profile.trustScoreBreakdown = breakdown;
          await profile.save();
          return profile;
        } catch (calcErr) {
          console.error("Error auto-updating trust score in list:", calcErr);
          return profile;
        }
      })
    );

    res.status(200).json({
      success: true,
      data: updatedFiltered,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/influencers/:id
export const getInfluencerById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await InfluencerProfile.findOne({
      user: req.params.id,
    }).populate("user", "name email avatar hasSignedUp createdAt");

    if (!profile) return next(new AppError("Influencer not found", 404));

    const user = profile.user as { email?: string };
    await syncYouTubeForProfile(profile, user?.email);

    const { score, breakdown, aiModelMetrics } = await calculateTrustScore(profile);
    profile.trustScore = score;
    profile.trustScoreBreakdown = breakdown;
    await profile.save();

    const pastCampaigns = await Campaign.find({ selectedInfluencers: profile.user._id }).select("title description budget status createdAt");
    const profileObj = profile.toObject() as any;
    profileObj.pastCampaigns = pastCampaigns;
    profileObj.trustScore = score;
    profileObj.trustScoreBreakdown = breakdown;
    profileObj.aiModelMetrics = aiModelMetrics;

    res.status(200).json({ success: true, data: profileObj });
  } catch (err) {
    next(err);
  }
};

// PUT /api/influencers/profile  (influencer updates their own profile)
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allowedFields = [
      "niche",
      "location",
      "country",
      "bio",
      "platforms",
      "tags",
    ];
    
    let profile = await InfluencerProfile.findOne({ user: req.user?.userId }).populate("user", "name email avatar");
    if (!profile) return next(new AppError("Profile not found", 404));

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
         (profile as any)[field] = req.body[field];
      }
    }

    const userDoc = profile.user as { email?: string } | undefined;
    const userEmail = userDoc?.email;
    let youtubeSynced = false;
    if (profile.platforms?.youtube?.handle?.trim()) {
      youtubeSynced = await syncYouTubeForProfile(profile, userEmail);
    }

    if (profile.platforms?.instagram) {
      const ig = profile.platforms.instagram;
      const followers = ig.followers ?? 0;
      const likes = ig.avgLikes ?? 0;
      const comments = ig.avgComments ?? 0;
      if (followers > 0 && (likes > 0 || comments > 0)) {
        const derived = Math.min(
          100,
          Number((((likes + comments) / followers) * 100).toFixed(2))
        );
        if (!ig.engagementRate || ig.engagementRate === 0) {
          ig.engagementRate = derived;
        }
      }
    }

    const { score, breakdown, aiModelMetrics } = await calculateTrustScore(profile);
    profile.trustScore = score;
    profile.trustScoreBreakdown = breakdown;

    await profile.save();

    const message = youtubeSynced
      ? "Profile updated. YouTube analytics and trust score refreshed."
      : profile.platforms?.youtube?.handle?.trim() && !getYouTubeApiKey()
        ? "Profile saved. Add YOUTUBE_API_KEY to the server .env to sync YouTube analytics."
        : profile.platforms?.youtube?.handle?.trim()
          ? "Profile saved. Could not find that YouTube channel — check the handle."
          : "Profile updated successfully";

    res.status(200).json({
      success: true,
      message,
      data: {
        ...profile.toObject(),
        trustScore: score,
        trustScoreBreakdown: breakdown,
        aiModelMetrics,
        youtubeSynced,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/influencers/:id/trust-score  (internal — called by ML service)
// In production this would be called by your Python AI service via a secure internal token
export const recomputeTrustScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { engagementAuthenticity, followerQuality, contentConsistency, collaborationHistory } =
      req.body;

    // Weighted average: tweak weights as your ML model evolves
    const trustScore = Math.round(
      engagementAuthenticity * 0.35 +
        followerQuality * 0.30 +
        contentConsistency * 0.20 +
        collaborationHistory * 0.15
    );

    const profile = await InfluencerProfile.findOneAndUpdate(
      { user: req.params.id },
      {
        trustScore,
        trustScoreBreakdown: {
          engagementAuthenticity,
          followerQuality,
          contentConsistency,
          collaborationHistory,
        },
      },
      { new: true }
    );

    if (!profile) return next(new AppError("Influencer not found", 404));

    res.status(200).json({ success: true, data: { trustScore } });
  } catch (err) {
    next(err);
  }
};

// GET /api/influencers/recommendations
export const getRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetNiche, country, platform, minFollowers, minTrustScore, minEngagement, search } = req.query as Record<string, string>;
    
    const filter: Record<string, unknown> = {};

    if (platform === "instagram") {
      filter["platforms.instagram.handle"] = { $exists: true, $ne: "" };
    } else if (platform === "youtube") {
      filter["platforms.youtube.handle"] = { $exists: true, $ne: "" };
    }

    if (country) filter.country = { $regex: country, $options: "i" };
    if (minFollowers) filter.totalFollowers = { $gte: Number(minFollowers) };
    if (minTrustScore) filter.trustScore = { $gte: Number(minTrustScore) };
    if (minEngagement) filter.avgEngagementRate = { $gte: Number(minEngagement) };
    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: "i" },
        role: "influencer"
      }).select("_id");
      filter.user = { $in: matchingUsers.map((u) => u._id) };
    }

    // Fetch filtered profiles to score them
    let profiles = await InfluencerProfile.find(filter).populate("user", "name avatar");
    profiles = profiles.filter(p => p.user !== null);
    
    // Max followers for normalization
    let maxFollowers = 1;
    profiles.forEach(p => {
      if (p.totalFollowers > maxFollowers) maxFollowers = p.totalFollowers;
    });

    const scoredProfiles = profiles.map(p => {
      const engagementScore = Math.min(40, (p.avgEngagementRate / 100) * 40); // max 40 points
      const followerScore = Math.min(30, (p.totalFollowers / maxFollowers) * 30); // max 30 points
      
      let nicheMatchScore = 0;
      if (targetNiche) {
        const niches = p.niche.map(n => n.toLowerCase());
        const tags = p.tags?.map(t => t.toLowerCase()) || [];
        const target = targetNiche.toLowerCase();
        
        if (niches.includes(target) || tags.includes(target)) {
          nicheMatchScore = 30; // max 30 points
        } else {
          // partial match
          const hasPartial = niches.some(n => n.includes(target)) || tags.some(t => t.includes(target));
          if (hasPartial) nicheMatchScore = 15;
        }
      } else {
        // If no target niche provided, give average points
        nicheMatchScore = 15; 
      }

      const recommendationScore = engagementScore + followerScore + nicheMatchScore;
      
      return {
        ...p.toObject(),
        recommendationScore: Math.round(recommendationScore)
      };
    });

    // Sort by recommendation score descending
    scoredProfiles.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.status(200).json({
      success: true,
      data: scoredProfiles.slice(0, 20), // return top 20
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/influencers/:id/calculate-trust-score
export const calculateInfluencerTrustScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await InfluencerProfile.findOne({ user: req.params.id }).populate("user", "name email avatar");
    if (!profile) return next(new AppError("Influencer not found", 404));

    // Fetch real-time data from APIs
    const user = profile.user as any;
    const userEmail = user?.email;
    
    if (userEmail && userEmail.endsWith("@youtube.test")) {
      await syncYouTubeForProfile(profile, userEmail);
    } else if (profile.platforms?.instagram?.handle) {
      await syncInstagramForProfile(profile, userEmail);
    }

    const { score, breakdown, aiModelMetrics } = await calculateTrustScore(profile);

    profile.trustScore = score;
    profile.trustScoreBreakdown = breakdown;
    await profile.save();

    res.status(200).json({
      success: true,
      data: { trustScore: score, breakdown, aiModelMetrics }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/influencers/categorize
export const categorizeInfluencers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profiles = await InfluencerProfile.find({}, "niche tags _id");
    
    if (profiles.length === 0) {
       res.status(200).json({ success: true, message: "No profiles to categorize" });
       return;
    }

    const assignments = categorizeInfluencersByNiche(profiles, 5); // 5 clusters

    // Update profiles
    const updatePromises = Object.entries(assignments).map(([id, categoryName]) => {
      return InfluencerProfile.findByIdAndUpdate(id, { systemCategory: categoryName });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Categorized ${profiles.length} influencers`,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/influencers/:id/predict-roi
export const predictInfluencerROI = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { investment, productValue } = req.body;
    
    if (!investment || !productValue) {
      return next(new AppError("Please provide investment and productValue", 400));
    }

    const profile = await InfluencerProfile.findOne({ user: req.params.id }).populate("user", "name");
    if (!profile) return next(new AppError("Influencer not found", 404));

    const platformMetrics = getUnifiedPlatformMetrics(profile);
    const baseReach = getCampaignReachForROI(profile);
    const engagementRate = platformMetrics.engagementRate || profile.avgEngagementRate || 5.0;

    // 3. Trust Score
    const trustScore = profile.trustScore || 50;

    const mlResult = predictCampaignROIWithML(
      baseReach,
      engagementRate,
      trustScore,
      Number(investment),
      Number(productValue)
    );

    const influencerName = (profile.user as any)?.name || "this influencer";

    res.status(200).json({
      success: true,
      data: {
        estimatedRevenue: mlResult.estimatedRevenue,
        predictedROI: mlResult.predictedROI,
        roiPercentage: mlResult.roiPercentage,
        aiModelMetrics: mlResult.aiModelMetrics,
        primaryPlatform: platformMetrics.primaryPlatform,
        summary: `Based on ${influencerName}'s ${platformMetrics.primaryPlatform} reach of ~${Math.round(baseReach)} per post, ${engagementRate.toFixed(1)}% engagement rate, and ${trustScore}/100 Trust Score, we predict ~${mlResult.predictedConversions} sales. At PKR ${productValue} per product, expected revenue is PKR ${mlResult.estimatedRevenue.toLocaleString()}. Subtracting your PKR ${investment} budget yields a net ROI of PKR ${mlResult.predictedROI.toLocaleString()} (${mlResult.roiPercentage}%).`
      }
    });
  } catch (err) {
    next(err);
  }
};
