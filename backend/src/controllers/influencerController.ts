import { Response, NextFunction } from "express";
import { InfluencerProfile } from "../models/InfluencerProfile";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../types";

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

    if (niche) filter.niche = { $in: niche.split(",") };
    if (country) filter.country = { $regex: country, $options: "i" };
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
        select: "name email avatar",
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
                select: "name email avatar",
              })
              .sort(sortObj)
              .skip(skip)
              .limit(limitNum);
            total = await InfluencerProfile.countDocuments(filter);
        } catch (seedErr) {
            console.error("Error auto-seeding YouTube data:", seedErr);
        }
    }

    // Filter out nulls when search match removes non-matching users
    const filtered = search
      ? profiles.filter((p) => p.user !== null)
      : profiles;

    res.status(200).json({
      success: true,
      data: filtered,
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
    }).populate("user", "name email avatar createdAt");

    if (!profile) return next(new AppError("Influencer not found", 404));

    // Fetch real-time data from YouTube API if it's a youtube seeded account
    const user = profile.user as any;
    if (user && user.email && user.email.endsWith("@youtube.test")) {
      const channelId = user.email.split("@")[0];
      const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyDJdoO_EFuDpga_8vRo1eDWkETHmagDgsw";
      
      try {
        const statsURL = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`;
        const statsRes = await fetch(statsURL);
        const statsData = await statsRes.json() as any;
        const channelData = statsData.items?.[0];
        
        if (channelData) {
          const subs = parseInt(channelData.statistics.subscriberCount || "0", 10);
          const views = parseInt(channelData.statistics.viewCount || "0", 10);
          const videoCount = parseInt(channelData.statistics.videoCount || "0", 10);
          const description = channelData.snippet.description || "";
          
          const avgViews = Math.floor(views / (videoCount || 1)) || 0;
          const engagementRate = Math.min(100, Number(((avgViews / (subs || 1)) * 100).toFixed(2)));

          // Update the DB silently in the background
          await InfluencerProfile.updateOne(
            { _id: profile._id },
            { 
               $set: { 
                 "platforms.youtube.subscribers": subs,
                 "platforms.youtube.avgViews": avgViews,
                 "platforms.youtube.engagementRate": engagementRate,
                 "platforms.youtube.handle": channelData.snippet.title,
                 bio: description,
                 totalFollowers: subs,
                 avgEngagementRate: engagementRate
               } 
            }
          );
          
          // Update the local object before sending response
          if (profile.platforms && profile.platforms.youtube) {
              profile.platforms.youtube.subscribers = subs;
              profile.platforms.youtube.avgViews = avgViews;
              profile.platforms.youtube.engagementRate = engagementRate;
              profile.platforms.youtube.handle = channelData.snippet.title;
          }
          profile.bio = description;
          profile.totalFollowers = subs;
          profile.avgEngagementRate = engagementRate;
        }
      } catch (err) {
        console.error("Error fetching live YouTube data:", err);
      }
    }

    res.status(200).json({ success: true, data: profile });
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

    // Fetch live YouTube data if a handle is provided
    if (profile.platforms && profile.platforms.youtube && profile.platforms.youtube.handle) {
      let handle = profile.platforms.youtube.handle;
      // Extract from URL or remove @
      if (handle.includes('youtube.com/')) {
        handle = handle.split('/').pop() || handle;
      }
      handle = handle.replace('@', '');
      
      const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyDJdoO_EFuDpga_8vRo1eDWkETHmagDgsw";
      
      try {
        const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${handle}&key=${API_KEY}`;
        const searchRes = await fetch(searchURL);
        const searchData = await searchRes.json() as any;
        
        if (searchData.items && searchData.items.length > 0) {
           const channelId = searchData.items[0].snippet.channelId;
           const statsURL = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`;
           const statsRes = await fetch(statsURL);
           const statsData = await statsRes.json() as any;
           const channelData = statsData.items?.[0];

           if (channelData) {
             const subs = parseInt(channelData.statistics.subscriberCount || "0", 10);
             const views = parseInt(channelData.statistics.viewCount || "0", 10);
             const videoCount = parseInt(channelData.statistics.videoCount || "0", 10);
             const description = channelData.snippet.description;
             
             const avgViews = Math.floor(views / (videoCount || 1)) || 0;
             const engagementRate = Math.min(100, Number(((avgViews / (subs || 1)) * 100).toFixed(2)));

             profile.platforms.youtube.subscribers = subs;
             profile.platforms.youtube.avgViews = avgViews;
             profile.platforms.youtube.engagementRate = engagementRate;
             if (!profile.bio || profile.bio === "Fashion enthusiast and lifestyle content creator based in Dubai. Specializing in sustainable fashion, beauty reviews, and lifestyle vlogs.") {
                 profile.bio = description || profile.bio;
             }
           }
        }
      } catch(err) {
        console.error("Error fetching YouTube profile on update", err);
      }
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
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
