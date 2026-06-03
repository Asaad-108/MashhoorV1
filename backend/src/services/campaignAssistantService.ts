import { ICampaign } from "../models/Campaign";

export type CampaignRecord = {
  campaign_name: string;
  campaign_description: string;
  target_niche: string;
  target_region: string;
  campaign_budget: string;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_objective: string;
  influencer_task: string;
};

const SCHEMA_KEYWORDS: Record<keyof CampaignRecord, string[]> = {
  campaign_budget: ["budget", "pay", "cost", "payout", "money", "cash", "fee", "compensation", "payment"],
  campaign_start_date: ["start", "begin", "launch", "starting"],
  campaign_end_date: ["end", "conclude", "finish", "deadline", "ending"],
  target_region: ["region", "location", "where", "country", "city", "pakistan"],
  target_niche: ["niche", "category", "type of content", "audience"],
  campaign_description: ["describe", "summary", "brief", "about", "overview", "product"],
  influencer_task: ["do", "task", "deliverable", "role", "expected", "work", "requirements"],
  campaign_name: ["campaign", "name", "title"],
  campaign_objective: ["objective", "goal", "purpose", "metrics"],
};

const OUT_OF_SCOPE = [
  "python", "president", "cricket", "football", "recipe", "weather", "joke",
  "stock", "java", "c++", "prime minister", "global warming",
];

export function campaignToRecord(campaign: ICampaign, businessName?: string): CampaignRecord {
  const budget = campaign.budget;
  const budgetStr = budget
    ? `${budget.currency || "PKR"} ${budget.total?.toLocaleString?.() ?? budget.total} (spent: ${budget.spent ?? 0})`
    : "N/A";

  const start = campaign.timeline?.startDate
    ? new Date(campaign.timeline.startDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";
  const end = campaign.timeline?.endDate
    ? new Date(campaign.timeline.endDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const niche = Array.isArray(campaign.niche) ? campaign.niche.join(", ") : String(campaign.niche ?? "");
  const region = Array.isArray(campaign.targetLocations)
    ? campaign.targetLocations.join(", ")
    : "Pakistan";

  const reqs = campaign.requirements;
  const taskParts: string[] = [];
  if (reqs?.contentType?.length) taskParts.push(`Content: ${reqs.contentType.join(", ")}`);
  if (reqs?.platforms?.length) taskParts.push(`Platforms: ${reqs.platforms.join(", ")}`);
  if (reqs?.minFollowers) taskParts.push(`Min followers: ${reqs.minFollowers}`);
  const influencer_task =
    taskParts.length > 0
      ? taskParts.join(". ")
      : "Create and publish campaign content as agreed with the brand.";

  return {
    campaign_name: campaign.title,
    campaign_description: campaign.description,
    target_niche: niche || "General",
    target_region: region,
    campaign_budget: budgetStr,
    campaign_start_date: start,
    campaign_end_date: end,
    campaign_objective: campaign.goals || `Brand collaboration managed by ${businessName || "the business"}.`,
    influencer_task,
  };
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[?!.,#>]/g, "").trim();
}

function scoreField(input: string, keywords: string[]): number {
  const words = input.split(/\s+/);
  let hits = 0;
  for (const kw of keywords) {
    if (input.includes(kw) || words.some((w) => kw.includes(w) && w.length > 2)) hits++;
  }
  return Math.min(1, hits / Math.max(2, keywords.length * 0.35));
}

function computeRelevance(input: string): number {
  let maxScore = 0;
  for (const keywords of Object.values(SCHEMA_KEYWORDS)) {
    maxScore = Math.max(maxScore, scoreField(input, keywords));
  }
  if (OUT_OF_SCOPE.some((n) => input.includes(n))) return Math.min(maxScore, 0.2);
  return maxScore;
}

function pickTopField(input: string): { field: keyof CampaignRecord; score: number } {
  let best: keyof CampaignRecord = "campaign_description";
  let bestScore = 0;
  for (const [field, keywords] of Object.entries(SCHEMA_KEYWORDS) as [
    keyof CampaignRecord,
    string[],
  ][]) {
    const s = scoreField(input, keywords);
    if (s > bestScore) {
      bestScore = s;
      best = field;
    }
  }
  return { field: best, score: bestScore };
}

function buildFacts(input: string, record: CampaignRecord): string[] {
  const facts: string[] = [];
  const add = (label: string, value: string) => {
    if (value && value !== "N/A") facts.push(`${label}: ${value}`);
  };

  if (["budget", "pay", "cost", "money", "fee"].some((w) => input.includes(w))) {
    add("Campaign Budget", record.campaign_budget);
  }
  if (["start", "begin", "launch"].some((w) => input.includes(w))) {
    add("Start Date", record.campaign_start_date);
  }
  if (["end", "finish", "deadline"].some((w) => input.includes(w))) {
    add("End Date", record.campaign_end_date);
  }
  if (["region", "location", "where", "country"].some((w) => input.includes(w))) {
    add("Target Region", record.target_region);
  }
  if (["niche", "category"].some((w) => input.includes(w))) {
    add("Content Niche", record.target_niche);
  }
  if (
    ["task", "deliverable", "do", "expected", "role", "work"].some((w) => input.includes(w))
  ) {
    add("Your Deliverables", record.influencer_task);
  }
  if (["objective", "goal", "purpose"].some((w) => input.includes(w))) {
    add("Campaign Objectives", record.campaign_objective);
  }

  if (
    ["about", "describe", "summary", "brief", "overview"].some((w) => input.includes(w)) ||
    facts.length === 0
  ) {
    add("Campaign Overview", record.campaign_description);
  }

  return facts;
}

function runLocalPipeline(
  userMessage: string,
  chatHistory: { user: string; bot: string }[],
  record: CampaignRecord
): { reply: string; trace?: string } {
  const cleaned = normalize(userMessage);
  if (!cleaned) {
    return { reply: "Please type a valid question regarding the campaign." };
  }

  const acks = ["yes", "no", "ok", "okay", "sure", "thanks", "thank you", "great", "understood"];
  if (acks.includes(cleaned)) {
    return {
      reply:
        "Understood. Ask me anything about this campaign's budget, timeline, location, niche, or deliverables.",
    };
  }

  if (["hi", "hello", "hey", "aoa", "salam", "hy"].some((g) => cleaned === g || cleaned.startsWith(g + " "))) {
    return {
      reply: `Hello! I'm the Mashhoor assistant for "${record.campaign_name}". I can answer questions about the budget, schedule, target region, content niche, and what's expected from you. Please ask if you have any question related to the campaign.`,
    };
  }

  const relevance = computeRelevance(cleaned);
  const { field, score } = pickTopField(cleaned);

  if (relevance < 0.22 && score < 0.2) {
    return {
      reply: `I'm specialized in the "${record.campaign_name}" campaign only — budget, timeline, location, niche, and deliverables. Please ask if you have any question related to the campaign.`,
      trace: "Out-Of-Scope Guardrail Triggered",
    };
  }

  const value = record[field];
  if (!value || value === "N/A") {
    const readable = field.replace(/_/g, " ");
    return {
      reply: `I don't have the specific ${readable} on file yet. Please ask if you have any question related to the campaign.`,
      trace: "Missing Data Gate Triggered",
    };
  }

  const facts = buildFacts(cleaned, record);
  const historyNote =
    chatHistory.length > 0
      ? ` (Continuing our conversation about ${record.campaign_name}.)`
      : "";

  const factText = facts.join(" ");
  return {
    reply: `${factText}${historyNote} Please ask if you have any question related to the campaign.`,
    trace: `Matched: ${field}`,
  };
}

export async function generateAssistantWelcome(
  campaign: ICampaign,
  businessName?: string
): Promise<string> {
  const record = campaignToRecord(campaign, businessName);
  return (
    `Hi! You've been invited to collaborate on "${record.campaign_name}" by ${businessName || "a brand"} on Mashhoor. ` +
    `I'm your campaign assistant — ask me about the budget (${record.campaign_budget}), timeline (${record.campaign_start_date} – ${record.campaign_end_date}), ` +
    `target region (${record.target_region}), niche (${record.target_niche}), or what you need to deliver. ` +
    `Please ask if you have any question related to the campaign.`
  );
}

export async function runCampaignAssistantPipeline(params: {
  userMessage: string;
  chatHistory: { user: string; bot: string }[];
  campaign: ICampaign;
  businessName?: string;
}): Promise<{ reply: string; trace?: string }> {
  const record = campaignToRecord(params.campaign, params.businessName);
  const aiUrl = process.env.AI_SERVICE_URL?.replace(/\/$/, "");

  if (aiUrl) {
    try {
      const res = await fetch(`${aiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: params.userMessage,
          chat_history: params.chatHistory,
          campaign_record: record,
        }),
        signal: AbortSignal.timeout(Number(process.env.AI_SERVICE_TIMEOUT_MS) || 120000),
      });
      if (res.ok) {
        const json = (await res.json()) as { reply: string; trace?: string };
        if (json.reply) return { reply: json.reply, trace: json.trace };
      }
    } catch (err) {
      console.warn("AI service unavailable, using local campaign assistant:", err);
    }
  }

  return runLocalPipeline(params.userMessage, params.chatHistory, record);
}
