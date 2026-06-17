import mongoose from "mongoose";
import dotenv from "dotenv";
import { inviteInfluencerToCampaign } from "./services/campaignInviteService";
import { User } from "./models/User";
import { Campaign } from "./models/Campaign";

dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");

  const influencer = await User.findOne({ email: "muhammadasad1859@gmail.com" });
  if (!influencer) return console.log("No influencer found");

  const campaign = await Campaign.findOne({});
  if (!campaign) return console.log("No campaign found");

  const business = await User.findById(campaign.business);
  if (!business) return console.log("No business found");

  try {
    const result = await inviteInfluencerToCampaign({
      campaignId: campaign._id.toString(),
      businessId: business._id.toString(),
      influencerId: influencer._id.toString(),
      message: "Testing email send...",
      contactEmail: undefined
    });
    console.log("Success! Result:", result);
  } catch (err) {
    console.error("Error from inviteInfluencerToCampaign:", err);
  }
  process.exit(0);
}
test();
