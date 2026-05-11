import { Response, NextFunction } from "express";
import { Campaign } from "../models/Campaign";
import { Outreach } from "../models/Outreach";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../types";

// GET /api/campaigns  (business sees their own)
export const getMyCampaigns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = "1", limit = "10" } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { business: req.user?.userId };
    if (status) filter.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Campaign.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/campaigns/:id
export const getCampaignById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "selectedInfluencers",
      "name email avatar"
    );
    if (!campaign) return next(new AppError("Campaign not found", 404));

    // Business can only see their own; influencers see campaigns they're selected for
    const userId = req.user?.userId;
    const isOwner = campaign.business.toString() === userId;
    const isSelected = campaign.selectedInfluencers.some(
      (inf) => inf._id?.toString() === userId
    );

    let hasOutreach = false;
    if (!isOwner && !isSelected) {
      hasOutreach = (await Outreach.exists({
        campaign: campaign._id,
        influencer: userId
      })) !== null;
    }

    if (!isOwner && !isSelected && !hasOutreach) {
      return next(new AppError("Not authorized to view this campaign", 403));
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
};

// POST /api/campaigns
export const createCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title, description, niche, targetLocations,
      budget, requirements, timeline, goals,
    } = req.body;

    if (!title || !description || !niche || !budget || !timeline) {
      return next(new AppError("title, description, niche, budget, and timeline are required", 400));
    }

    const campaign = await Campaign.create({
      business: req.user?.userId,
      title,
      description,
      niche,
      targetLocations,
      budget,
      requirements,
      timeline,
      goals,
      status: "draft",
    });

    res.status(201).json({
      success: true,
      message: "Campaign created",
      data: campaign,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/campaigns/:id
export const updateCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return next(new AppError("Campaign not found", 404));

    if (campaign.business.toString() !== req.user?.userId) {
      return next(new AppError("Not authorized", 403));
    }

    if (campaign.status === "completed" || campaign.status === "cancelled") {
      return next(new AppError("Cannot edit a completed or cancelled campaign", 400));
    }

    const allowedFields = [
      "title", "description", "niche", "targetLocations",
      "budget", "requirements", "timeline", "goals", "status", "progress",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await Campaign.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Campaign updated", data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/campaigns/:id
export const deleteCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return next(new AppError("Campaign not found", 404));

    if (campaign.business.toString() !== req.user?.userId) {
      return next(new AppError("Not authorized", 403));
    }

    await campaign.deleteOne();
    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/campaigns/:id/influencers  (add influencer to campaign)
export const addInfluencerToCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { influencerId } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return next(new AppError("Campaign not found", 404));

    if (campaign.business.toString() !== req.user?.userId) {
      return next(new AppError("Not authorized", 403));
    }

    const alreadyAdded = campaign.selectedInfluencers.some(
      (id) => id.toString() === influencerId
    );
    if (alreadyAdded) {
      return next(new AppError("Influencer already added to this campaign", 400));
    }

    campaign.selectedInfluencers.push(influencerId);
    await campaign.save();

    res.status(200).json({ success: true, message: "Influencer added to campaign", data: campaign });
  } catch (err) {
    next(err);
  }
};

// GET /api/campaigns/influencer  (influencer sees campaigns they're part of)
export const getInfluencerCampaigns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaigns = await Campaign.find({
      selectedInfluencers: req.user?.userId,
      status: { $in: ["active", "completed"] },
    })
      .populate("business", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
};
