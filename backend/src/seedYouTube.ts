import "dotenv/config";
import connectDB from "./config/database";
import { User } from "./models/User";
import { InfluencerProfile } from "./models/InfluencerProfile";

const API_KEY = "AIzaSyDJdoO_EFuDpga_8vRo1eDWkETHmagDgsw";
const CATEGORIES = ["Gaming", "Politics", "Tech", "Fashion", "Music", "Cricket"];
const CHANNELS_PER_CATEGORY = 10;
const MIN_SUBS = 20000;
const MAX_SUBS = 500000;

const mapCategoryToNiche = (category: string) => {
    switch (category) {
        case "Fashion": return "Fashion";
        case "Tech": return "Tech";
        case "Gaming": return "Gaming";
        case "Music": return "Entertainment";
        case "Cricket": return "Cricket";
        case "Politics": return "Politics";
        default: return "Entertainment";
    }
};

async function fetchChannelsByCategory(category: string) {
    let validChannels: any[] = [];
    let pageToken = "";

    console.log(`\n--- Fetching for Category: ${category} ---`);

    let attempts = 0;
    const MAX_ATTEMPTS = 25;

    while (validChannels.length < CHANNELS_PER_CATEGORY && attempts < MAX_ATTEMPTS) {
        attempts++;
        const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=20&q=${category}&regionCode=PK&pageToken=${pageToken}&key=${API_KEY}`;

        try {
            const searchRes = await fetch(searchURL);
            const searchData = await searchRes.json() as any;
            const items = searchData.items;

            if (!items || items.length === 0) break;

            for (const item of items) {
                if (validChannels.length >= CHANNELS_PER_CATEGORY) break;

                const channelId = item.snippet.channelId;
                const statsURL = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${API_KEY}`;

                try {
                    const statsRes = await fetch(statsURL);
                    const statsData = await statsRes.json() as any;
                    const channelData = statsData.items?.[0];

                    if (channelData) {
                        const subs = parseInt(channelData.statistics.subscriberCount || "0", 10);
                        const views = parseInt(channelData.statistics.viewCount || "0", 10);
                        const videoCount = parseInt(channelData.statistics.videoCount || "0", 10);

                        if (subs > MIN_SUBS && subs < MAX_SUBS) {
                            const avatarUrl = channelData.snippet.thumbnails?.high?.url || channelData.snippet.thumbnails?.default?.url;

                            // Require a profile picture
                            if (!avatarUrl) continue;

                            // Enforce Pakistan country
                            if (channelData.snippet.country && channelData.snippet.country !== "PK") {
                                console.log(`Skipped ${channelData.snippet.title} - Not from Pakistan (${channelData.snippet.country})`);
                                continue;
                            }

                            // STRICT KEYWORD FILTERING
                            const title = (channelData.snippet.title || "").toLowerCase();
                            const desc = (channelData.snippet.description || "").toLowerCase();

                            let keywords: string[] = [];
                            if (category === "Gaming") keywords = ["gaming", "game", "esports", "play", "gamer", "stream"];
                            else if (category === "Politics") keywords = ["politics", "news", "politic", "debate", "government", "policy"];
                            else if (category === "Tech") keywords = ["tech", "technology", "review", "gadget", "software", "hardware"];
                            else if (category === "Fashion") keywords = ["fashion", "style", "beauty", "clothing", "apparel", "makeup", "wear"];
                            else if (category === "Music") keywords = ["music", "song", "singer", "records", "album", "artist"];
                            else if (category === "Cricket") keywords = ["cricket", "sports", "match", "icc", "pcb", "bat", "ball"];

                            const isRelevant = keywords.some(kw => title.includes(kw) || desc.includes(kw));
                            if (!isRelevant) {
                                console.log(`Skipped ${channelData.snippet.title} - Irrelevant for ${category}`);
                                continue;
                            }

                            const email = `${channelData.id.toLowerCase()}@youtube.test`;
                            const userExists = await User.exists({ email });

                            if (!userExists) {
                                validChannels.push({
                                    Category: category,
                                    Name: channelData.snippet.title,
                                    Subscribers: subs,
                                    Views: views,
                                    VideoCount: videoCount,
                                    ID: channelData.id,
                                    Description: channelData.snippet.description.substring(0, 500),
                                    Avatar: avatarUrl,
                                    Country: "Pakistan"
                                });
                            }
                        }
                    }
                } catch (statsErr) {
                    console.error(`Failed to fetch stats for ${channelId}`);
                }
            }

            pageToken = searchData.nextPageToken;
            if (!pageToken) break;

        } catch (err: any) {
            console.error(`Error searching for ${category}`);
            break;
        }
    }

    return validChannels;
}

export async function seedData() {
    try {
        if (process.env.NODE_ENV !== "test") {
            await connectDB();
        }
        console.log("Starting YouTube data seed...");

        for (const category of CATEGORIES) {
            const channels = await fetchChannelsByCategory(category);

            for (const channel of channels) {
                const email = `${channel.ID.toLowerCase()}@youtube.test`;

                // Create user
                let user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({
                        name: channel.Name,
                        email: email,
                        password: "Password123!",
                        role: "influencer",
                        avatar: channel.Avatar,
                        isVerified: true
                    });
                }

                // Create profile
                let profile = await InfluencerProfile.findOne({ user: user._id });
                if (!profile) {
                    const actualCountry = "Pakistan";

                    const avgViews = Math.floor(channel.Views / (channel.VideoCount || 1)) || 0;
                    const engagementRate = Math.min(100, Number(((avgViews / (channel.Subscribers || 1)) * 100).toFixed(2)));

                    await InfluencerProfile.create({
                        user: user._id,
                        niche: [mapCategoryToNiche(channel.Category)],
                        location: actualCountry,
                        country: actualCountry,
                        bio: channel.Description || "",
                        platforms: {
                            youtube: {
                                handle: channel.Name,
                                subscribers: channel.Subscribers,
                                avgViews: avgViews,
                                engagementRate: engagementRate
                            }
                        },
                        trustScore: 0,
                        isVerified: true
                    });
                    console.log(`Created profile for ${channel.Name}`);
                } else {
                    console.log(`Profile for ${channel.Name} already exists`);
                }
            }
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error("Error seeding", err);
        throw err;
    }
}

if (require.main === module) {
    seedData().then(() => process.exit(0)).catch(() => process.exit(1));
}
