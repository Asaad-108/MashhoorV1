import crypto from "crypto";
import { invitationTemplate } from "../templates/invitationTemplate";
import { isEmailConfigured, sendEmail } from "./emailService";
import { AppError } from "../middleware/errorHandler";

const PLACEHOLDER_EMAIL_PATTERN = /@(youtube|instagram)\.test$/i;

export const isPlaceholderEmail = (email: string): boolean =>
  PLACEHOLDER_EMAIL_PATTERN.test(email.trim());

/** True only when the user completed signup on Mashhoor (not a seeded/imported profile). */
export const isRegisteredOnPlatform = (user: {
  hasSignedUp?: boolean;
}): boolean => user.hasSignedUp === true;

/** @deprecated Use isRegisteredOnPlatform(user) — email alone is not enough. */
export const isRegisteredInfluencer = (email: string): boolean =>
  !isPlaceholderEmail(email);

export const buildInviteLink = (campaignId: string, inviteToken: string): string => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const params = new URLSearchParams({
    role: "influencer",
    campaign: campaignId,
    invite: inviteToken,
  });
  return `${clientUrl}/signup?${params.toString()}`;
};

export const generateInviteToken = (): string => crypto.randomBytes(24).toString("hex");

export const sendCampaignInvitationEmail = async (params: {
  to: string;
  influencerName: string;
  campaignName: string;
  businessName: string;
  campaignId: string;
  inviteToken: string;
  personalMessage?: string;
}) => {
  if (!isEmailConfigured()) {
    throw new AppError("Email service is not configured. Add SMTP credentials to .env", 503);
  }

  const { to, influencerName, campaignName, businessName, campaignId, inviteToken, personalMessage } =
    params;

  const inviteLink = buildInviteLink(campaignId, inviteToken);
  const html = invitationTemplate(influencerName, campaignName, inviteLink, businessName);
  const subject = `${businessName} invited you to collaborate on Mashhoor`;
  const text = [
    `Hi ${influencerName},`,
    ``,
    `${businessName} invited you to collaborate on the campaign "${campaignName}" via Mashhoor.`,
    personalMessage ? `\nMessage from ${businessName}:\n${personalMessage}\n` : "",
    `Accept your invitation: ${inviteLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail(to, subject, text, html);
};
