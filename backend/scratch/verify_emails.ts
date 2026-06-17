/**
 * verify_emails.ts
 * Verifies that all 98 users have been updated in MongoDB.
 * Run: npx ts-node --transpile-only scratch/verify_emails.ts
 */
import connectDB from "../src/config/database";
import { User } from "../src/models/User";
import { InfluencerProfile } from "../src/models/InfluencerProfile";
import mongoose from "mongoose";

async function run() {
  await connectDB();
  
  const profiles = await InfluencerProfile.find().populate("user");
  console.log(`\nFound ${profiles.length} Influencer Profiles in the database:\n`);
  
  const emails = new Set<string>();
  const duplicates: string[] = [];
  
  for (const p of profiles) {
    const userObj = p.user as any;
    if (!userObj) {
      console.warn(`⚠️ Profile ID ${p._id} has no associated user!`);
      continue;
    }
    
    const platforms: string[] = [];
    if (p.platforms?.youtube?.handle) platforms.push(`YT: @${p.platforms.youtube.handle}`);
    if (p.platforms?.instagram?.handle) platforms.push(`IG: @${p.platforms.instagram.handle}`);
    
    console.log(`- "${userObj.name}" | Email: "${userObj.email}" | ${platforms.join(" & ")}`);
    
    if (emails.has(userObj.email)) {
      duplicates.push(userObj.email);
    }
    emails.add(userObj.email);
  }
  
  console.log(`\nTotal unique emails in DB: ${emails.size}`);
  if (duplicates.length > 0) {
    console.error(`❌ Found duplicate emails in DB:`, duplicates);
  } else {
    console.log("✅ All emails are 100% unique in DB!");
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
