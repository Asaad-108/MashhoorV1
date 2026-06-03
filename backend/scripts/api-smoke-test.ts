/**
 * API smoke tests for Mashhoor — run: npx ts-node scripts/api-smoke-test.ts
 */
import "dotenv/config";

const BASE = process.env.API_BASE || "http://localhost:5001/api";
const FALAK_ID = "6a1f4d6b06e3a56dc1fc09a0";

type Result = { name: string; ok: boolean; detail: string };

const results: Result[] = [];

function pass(name: string, detail = "OK") {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}: ${detail}`);
}

async function request(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

async function main() {
  console.log(`\n🧪 Mashhoor API smoke tests → ${BASE}\n`);

  const stamp = Date.now();
  const bizEmail = `test.biz.${stamp}@test.com`;
  const bizPassword = "TestPass123!";

  // 1. Health
  try {
    const { status, json } = await request("GET", "/health");
    if (status === 200 && json.success) pass("Health check");
    else fail("Health check", `status ${status}`);
  } catch (e) {
    fail("Health check", `Server not reachable — ${(e as Error).message}`);
    printSummary();
    process.exit(1);
  }

  // 2. Register business
  let bizToken = "";
  {
    const { status, json } = await request("POST", "/auth/register", {
      name: "Test Business",
      email: bizEmail,
      password: bizPassword,
      role: "business",
    });
    const data = json.data as { token?: string } | undefined;
    if (status === 201 && data?.token) {
      bizToken = data.token;
      pass("Register business");
    } else fail("Register business", `${status} ${JSON.stringify(json.message)}`);
  }

  if (!bizToken) {
    printSummary();
    process.exit(1);
  }

  // 3. Create campaign
  let campaignId = "";
  {
    const { status, json } = await request(
      "POST",
      "/campaigns",
      {
        title: `Smoke Test Campaign ${stamp}`,
        description: "Automated test campaign",
        niche: ["Tech"],
        budget: { total: 50000, currency: "PKR" },
        timeline: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        },
        goals: "Brand awareness",
      },
      bizToken
    );
    const data = json.data as { _id?: string } | undefined;
    if (status === 201 && data?._id) {
      campaignId = data._id;
      pass("Create campaign", campaignId);
    } else fail("Create campaign", `${status} ${JSON.stringify(json.message)}`);
  }

  // 4. Dashboard before/after add
  let totalBefore = 0;
  {
    const { status, json } = await request("GET", "/dashboard/business", undefined, bizToken);
    const data = json.data as { totalCampaigns?: number } | undefined;
    if (status === 200 && data) {
      totalBefore = data.totalCampaigns ?? 0;
      pass("Business dashboard", `totalCampaigns=${totalBefore}`);
    } else fail("Business dashboard", `${status}`);
  }

  // 5. Add Falak to campaign (invite flow)
  let inviteChannel = "";
  let inviteToken = "";
  if (campaignId) {
    const { status, json } = await request(
      "POST",
      `/campaigns/${campaignId}/influencers`,
      {
        influencerId: FALAK_ID,
        message: "We would love to collaborate with you on this campaign!",
      },
      bizToken
    );
    const data = json.data as {
      channel?: string;
      emailInvite?: { inviteToken?: string };
    } | undefined;
    if (status === 200 && data) {
      inviteChannel = data.channel || "";
      inviteToken = data.emailInvite?.inviteToken || "";
      pass(
        "Add influencer (Falak)",
        `channel=${inviteChannel}${inviteToken ? ", inviteToken set" : ""}`
      );
    } else fail("Add influencer (Falak)", `${status} ${JSON.stringify(json.message)}`);
  }

  // 6. Dashboard after add
  {
    const { status, json } = await request("GET", "/dashboard/business", undefined, bizToken);
    const data = json.data as {
      totalCampaigns?: number;
      recentCampaigns?: unknown[];
    } | undefined;
    if (status === 200 && data && (data.totalCampaigns ?? 0) >= totalBefore) {
      pass(
        "Dashboard reflects campaign",
        `total=${data.totalCampaigns}, recent=${data.recentCampaigns?.length ?? 0}`
      );
    } else fail("Dashboard reflects campaign", `before=${totalBefore} after=${data?.totalCampaigns}`);
  }

  // 7. Duplicate add (should be idempotent for email)
  if (campaignId) {
    const { status, json } = await request(
      "POST",
      `/campaigns/${campaignId}/influencers`,
      {
        influencerId: FALAK_ID,
        message: "Second attempt",
      },
      bizToken
    );
    const data = json.data as { channel?: string } | undefined;
    if (status === 200) {
      pass("Re-add influencer (idempotent)", `channel=${data?.channel}`);
    } else fail("Re-add influencer", `${status} ${JSON.stringify(json.message)}`);
  }

  // 8. Invite signup flow (only if email channel + token)
  if (inviteChannel === "email" && inviteToken) {
    const claimEmail = "muhammadasad1859@gmail.com";
    const { status, json } = await request("POST", "/auth/register", {
      name: "Falak Test",
      email: claimEmail,
      password: "NewPass123!",
      role: "influencer",
      inviteToken,
    });
    if (status === 200 || status === 201) {
      pass("Invite signup / account activation", String(json.message));
    } else {
      fail("Invite signup", `${status} ${JSON.stringify(json.message)}`);
    }
  } else if (inviteChannel === "platform") {
    pass("Invite signup skipped", "Falak treated as on-platform (hasSignedUp=true)");
  } else {
    fail("Invite signup skipped", `channel=${inviteChannel}, no token`);
  }

  // 9. List campaigns
  {
    const { status, json } = await request("GET", "/campaigns", undefined, bizToken);
    const data = json.data as unknown[] | undefined;
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      pass("List my campaigns", `count=${data.length}`);
    } else fail("List my campaigns", `${status}`);
  }

  printSummary();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
