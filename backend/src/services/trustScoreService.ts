import { IInfluencerProfile } from "../models/InfluencerProfile";
import { Campaign } from "../models/Campaign";
import { calculateTrustScoreWithML } from "./mlService";

export const calculateTrustScore = async (profile: IInfluencerProfile): Promise<{ score: number, breakdown: any, aiModelMetrics?: any }> => {
  const followers = profile.totalFollowers || 0;
  const engagementRate = profile.avgEngagementRate || 0;
  const avgViews = profile.platforms?.youtube?.avgViews || 0;
  const isVerified = profile.isVerified || false;

  // 1. Commercial Track Record (Only check campaigns done inside platform & business feedback)
  const pastCampaigns = await Campaign.find({ selectedInfluencers: profile.user });
  const campaignCount = pastCampaigns.length;
  let collaborationHistory = 0;

  if (campaignCount > 0) {
    const influencerReviews = pastCampaigns.flatMap(c => (c.reviews || []).filter(r => r.influencer.toString() === profile.user.toString()));
    if (influencerReviews.length > 0) {
      const avgRating = influencerReviews.reduce((sum, r) => sum + r.rating, 0) / influencerReviews.length;
      collaborationHistory = Math.round((avgRating / 5) * 100);
    } else {
      collaborationHistory = Math.min(100, 70 + campaignCount * 10);
    }
  }

  // 2. Content Consistency (Checking real upload date & video count from YouTube API)
  let contentConsistency = 80;
  const daysSinceLastUpload = profile.platforms?.youtube?.daysSinceLastUpload;
  const videoCount = profile.platforms?.youtube?.videoCount;

  if (videoCount === 0) {
    contentConsistency = 0; // 0 videos means 0% consistency!
  } else if (daysSinceLastUpload !== undefined && daysSinceLastUpload > 0) {
    if (daysSinceLastUpload <= 7) {
      contentConsistency = 95 + (isVerified ? 5 : 0);
    } else if (daysSinceLastUpload <= 30) {
      contentConsistency = 85 - Math.floor(daysSinceLastUpload / 3);
    } else if (daysSinceLastUpload <= 90) {
      contentConsistency = 65 - Math.floor((daysSinceLastUpload - 30) / 2);
    } else if (daysSinceLastUpload <= 180) {
      contentConsistency = 40 - Math.floor((daysSinceLastUpload - 90) / 4);
    } else {
      contentConsistency = Math.max(5, 20 - Math.floor(daysSinceLastUpload / 30));
    }
  } else if (videoCount !== undefined && videoCount > 0) {
    // Has videos but no recent upload date found
    contentConsistency = Math.min(60, 30 + videoCount * 2);
  } else {
    contentConsistency = followers < 500 ? 10 : 40;
  }

  // 3. Engagement Authenticity (Real engagement rate vs industry benchmark)
  let engagementAuthenticity = 80;
  if (followers < 10000) {
    // Nano benchmark ~5%
    if (engagementRate >= 3 && engagementRate <= 15) engagementAuthenticity = 95 + (isVerified ? 5 : 0);
    else if (engagementRate > 30) engagementAuthenticity = 40; // viral/bot spike
    else if (engagementRate < 0.5) engagementAuthenticity = 10; // dead bots
    else engagementAuthenticity = 75;
  } else {
    // Macro/Mega benchmark ~2.5%
    if (engagementRate >= 1.5 && engagementRate <= 8) engagementAuthenticity = 95 + (isVerified ? 5 : 0);
    else if (engagementRate > 20) engagementAuthenticity = 35; // unrealistic spike
    else if (engagementRate < 0.2) engagementAuthenticity = 5; // dead bots
    else engagementAuthenticity = 75;
  }

  // 4. Follower Quality (Active viewer retention ratio)
  let followerQuality = 75;
  const viewRatio = followers > 0 ? avgViews / followers : 0;
  if (viewRatio >= 0.15) {
    followerQuality = Math.min(100, 85 + Math.floor(viewRatio * 50));
  } else if (viewRatio >= 0.05) {
    followerQuality = 70 + Math.floor((viewRatio - 0.05) * 150);
  } else if (viewRatio > 0) {
    followerQuality = Math.max(10, Math.floor(viewRatio * 1400));
  } else {
    followerQuality = followers < 500 ? 15 : 5; // dead bot account
  }

  const breakdown = {
    engagementAuthenticity: Math.round(Math.max(0, Math.min(100, engagementAuthenticity))),
    followerQuality: Math.round(Math.max(0, Math.min(100, followerQuality))),
    contentConsistency: Math.round(Math.max(0, Math.min(100, contentConsistency))),
    collaborationHistory: Math.round(Math.max(0, Math.min(100, collaborationHistory)))
  };

  // We pass the 4 exact calculated pillars directly into the upgraded ML Ridge Regressor!
  const mlResult = calculateTrustScoreWithML(
    breakdown.followerQuality,
    breakdown.engagementAuthenticity,
    breakdown.contentConsistency,
    breakdown.collaborationHistory
  );

  // E.g., if collaborationHistory === 0 (new creator to Mashhoor but established on YouTube),
  // we do NOT penalize their Trust Score with a 0 for platform experience!
  // Instead, we evaluate their Trust Score based 100% on their active YouTube Audience Pillars!
  let activePillarAverage = 0;
  if (campaignCount > 0) {
    activePillarAverage = (breakdown.engagementAuthenticity + breakdown.followerQuality + breakdown.contentConsistency + breakdown.collaborationHistory) / 4;
  } else {
    activePillarAverage = (breakdown.engagementAuthenticity + breakdown.followerQuality + breakdown.contentConsistency) / 3;
  }

  // To ensure the ML model prediction doesn't inflate small accounts or deflate large accounts,
  // we apply a dynamic scaling factor based on their active pillar health!
  const mlWeight = 0.3;
  const pillarWeight = 0.7;
  
  const accurateScore = Math.round(mlWeight * mlResult.trustScore + pillarWeight * activePillarAverage);

  return {
    score: Math.max(0, Math.min(100, accurateScore)),
    breakdown,
    aiModelMetrics: mlResult.aiModelMetrics
  };
};
