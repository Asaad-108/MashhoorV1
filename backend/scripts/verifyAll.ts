import "dotenv/config";
import connectDB from "../src/config/database";
import { User } from "../src/models/User";
import { InfluencerProfile } from "../src/models/InfluencerProfile";

async function verifyAll() {
    await connectDB();
    console.log("Connected to DB.");

    try {
        await User.updateMany({ role: "influencer" }, { isVerified: true });
        await InfluencerProfile.updateMany({}, { isVerified: true });
        console.log("✅ All existing influencers have been marked as verified!");
    } catch (error) {
        console.error("❌ Error:", error);
    }

    process.exit(0);
}

verifyAll().catch(console.error);
