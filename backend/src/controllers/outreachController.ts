import { Response, NextFunction } from "express";
import { Outreach } from "../models/Outreach";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest, SentimentLabel } from "../types";
import { Campaign } from "../models/Campaign";
import { inviteInfluencerToCampaign } from "../services/campaignInviteService";

// POST /api/outreach — same flow as adding to campaign (platform vs email auto)
export const sendOutreach = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId, influencerId, message, isAiGenerated = false, contactEmail } = req.body;

    if (!campaignId || !influencerId || !message) {
      return next(new AppError("campaignId, influencerId, and message are required", 400));
    }

    const result = await inviteInfluencerToCampaign({
      campaignId,
      businessId: req.user!.userId,
      influencerId,
      message,
      contactEmail,
      isAiGenerated,
    });

    const responseMessage =
      result.channel === "email"
        ? "Invitation sent by email — creator is not registered on Mashhoor yet."
        : "Invitation sent inside Mashhoor.";

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        outreach: result.outreach,
        emailInvite: result.emailInvite,
        channel: result.channel,
        campaign: result.campaign,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/outreach/campaign/:campaignId
export const getOutreachByCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const outreaches = await Outreach.find({ campaign: req.params.campaignId })
      .populate("influencer", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: outreaches });
  } catch (err) {
    next(err);
  }
};

// GET /api/outreach/my-requests  (influencer sees their incoming requests)
export const getMyRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const filter: Record<string, unknown> = { influencer: req.user?.userId };
    if (status) filter.status = status;

    const outreaches = await Outreach.find(filter)
      .populate("campaign", "title description budget timeline")
      .populate("business", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: outreaches });
  } catch (err) {
    next(err);
  }
};

// PUT /api/outreach/:id/reply  (influencer replies)
export const replyToOutreach = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reply, accept } = req.body;
    if (!reply) return next(new AppError("Reply message is required", 400));

    const outreach = await Outreach.findById(req.params.id);
    if (!outreach) return next(new AppError("Outreach not found", 404));

    if (outreach.influencer.toString() !== req.user?.userId) {
      return next(new AppError("Not authorized", 403));
    }

    outreach.influencerReply = reply;
    outreach.status = accept === true ? "accepted" : accept === false ? "rejected" : "replied";
    outreach.repliedAt = new Date();

    const sentiment = mockSentimentAnalysis(reply);
    outreach.sentiment = { ...sentiment, analyzedAt: new Date() };

    await outreach.save();

    if (accept === true) {
      const campaign = await Campaign.findById(outreach.campaign);
      if (campaign && !campaign.selectedInfluencers.includes(outreach.influencer)) {
        campaign.selectedInfluencers.push(outreach.influencer);
        if (campaign.status === "draft") {
          campaign.status = "active";
        }
        await campaign.save();
      }
    } else if (accept === false) {
      const campaign = await Campaign.findById(outreach.campaign);
      if (campaign && campaign.selectedInfluencers.includes(outreach.influencer)) {
        campaign.selectedInfluencers = campaign.selectedInfluencers.filter(
          (id) => id.toString() !== outreach.influencer.toString()
        );
        await campaign.save();
      }
    }

    res.status(200).json({ success: true, message: "Reply submitted", data: outreach });
  } catch (err) {
    next(err);
  }
};

// PUT /api/outreach/:id/status  (mark as opened, etc.)
export const updateOutreachStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const outreach = await Outreach.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === "opened" ? { openedAt: new Date() } : {}),
      },
      { new: true }
    );
    if (!outreach) return next(new AppError("Outreach not found", 404));
    res.status(200).json({ success: true, data: outreach });
  } catch (err) {
    next(err);
  }
};

function mockSentimentAnalysis(text: string): { label: SentimentLabel; score: number } {
  const lower = text.toLowerCase();
  const positiveWords = ["great", "happy", "love", "interested", "yes", "absolutely", "excited", "sure"];
  const negativeWords = ["no", "not", "busy", "decline", "reject", "pass", "sorry", "unfortunately"];

  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (posCount > negCount) return { label: "positive", score: 0.7 + posCount * 0.05 };
  if (negCount > posCount) return { label: "negative", score: 0.7 + negCount * 0.05 };
  return { label: "neutral", score: 0.5 };
}
