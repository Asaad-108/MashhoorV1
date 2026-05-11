import "dotenv/config";
import connectDB from "./src/config/database";
import { User } from "./src/models/User";
import { InfluencerProfile } from "./src/models/InfluencerProfile";

async function run() {
  await connectDB();
  const users = await User.find({ email: /@youtube\.test$/ });
  const userIds = users.map(u => u._id);
  
  await InfluencerProfile.deleteMany({ user: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  
  console.log(`Deleted ${userIds.length} old YouTube records.`);
  process.exit(0);
}

run();
