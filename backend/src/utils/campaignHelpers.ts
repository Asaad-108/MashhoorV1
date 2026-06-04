import mongoose from "mongoose";

export function influencerSelectedOnCampaign(
  selectedInfluencers: mongoose.Types.ObjectId[],
  influencerId: mongoose.Types.ObjectId | string
): boolean {
  const target = influencerId.toString();
  return selectedInfluencers.some((id) => id.toString() === target);
}

export function addInfluencerToCampaign(
  selectedInfluencers: mongoose.Types.ObjectId[],
  influencerId: mongoose.Types.ObjectId
): mongoose.Types.ObjectId[] {
  if (influencerSelectedOnCampaign(selectedInfluencers, influencerId)) {
    return selectedInfluencers;
  }
  return [...selectedInfluencers, influencerId];
}
