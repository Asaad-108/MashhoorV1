import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/User";
import { InfluencerProfile } from "./models/InfluencerProfile";

dotenv.config();

const seedDummy = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/mashhoor";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const email = "muhammadasad1859@gmail.com";

    // Create or update User
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: "Muhammad Asad",
        email,
        password: "password123", // Dummy password
        role: "influencer",
      });
      await user.save();
      console.log("Created dummy user");
    } else {
      console.log("User already exists, id:", user._id);
    }

    // Create InfluencerProfile
    let profile = await InfluencerProfile.findOne({ user: user._id });
    if (!profile) {
      profile = new InfluencerProfile({
        user: user._id,
        bio: "This is a dummy bio for Muhammad Asad.",
        niche: ["Tech"],
        location: "Pakistan",
        platforms: {
          instagram: {
            handle: "muhammadasad_ig",
            followers: 120000,
            engagementRate: 4.5,
          },
          youtube: {
            handle: "muhammadasad_yt",
            subscribers: 250000,
            avgViews: 80000,
            engagementRate: 6.2,
          }
        },
        totalFollowers: 370000,
        avgEngagementRate: 5.35,
        trustScore: 85,
        pastCampaigns: [],
        tags: ["programming", "developer", "vlog"],
      });
      await profile.save();
      console.log("Created dummy influencer profile");
    } else {
      console.log("Influencer profile already exists");
    }

    mongoose.disconnect();
    console.log("Done");
  } catch (error) {
    console.error("Error seeding dummy data:", error);
    process.exit(1);
  }
};

seedDummy();
