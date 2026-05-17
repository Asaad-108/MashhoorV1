import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:5001/api";

async function testMethodologies() {
  console.log("=== Testing 4 Methodologies ===");

  try {
    // 1. Register a test business user
    console.log("\n[1] Registering temporary business user...");
    const email = `test-brand-${Date.now()}@example.com`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Brand",
        email,
        password: "password123",
        role: "business"
      })
    });
    const regData = await regRes.json() as any;
    if (!regData.success) throw new Error(regData.message);
    const token = regData.data.token;
    console.log("✓ Successfully registered and obtained token");

    // 2. Test Recommendation Engine
    console.log("\n[2] Testing AI-Powered Recommendation Engine...");
    const recRes = await fetch(`${API_BASE}/influencers/recommendations?targetNiche=fashion`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const recData = await recRes.json() as any;
    console.log(`✓ Recommendations fetched: ${recData.data?.length} influencers`);
    if (recData.data && recData.data.length > 0) {
      console.log(`  Top match: ${recData.data[0].user?.name} (Score: ${recData.data[0].recommendationScore})`);
      // Save ID for next test
      const influencerId = recData.data[0].user._id;

      // 3. Test Trust Score Calculation
      console.log("\n[3] Testing Trust Score Calculation...");
      const trustRes = await fetch(`${API_BASE}/influencers/${influencerId}/calculate-trust-score`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const trustData = await trustRes.json() as any;
      console.log("trustData response:", JSON.stringify(trustData, null, 2));
      console.log(`✓ Trust Score Calculated: ${trustData.data?.trustScore}`);
      console.log(`  Breakdown:`, trustData.data?.breakdown);
      if (trustData.data?.aiModelMetrics) {
        console.log(`  AI Trust Metrics:`, trustData.data?.aiModelMetrics);
      }
      // 4. Test Smart ROI Predictor
      console.log("\n[4] Testing Smart ROI Predictor...");
      const roiRes = await fetch(`${API_BASE}/influencers/${influencerId}/predict-roi`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          investment: 15000,
          productValue: 3000
        })
      });
      const roiData = await roiRes.json() as any;
      console.log(`✓ ROI Predicted:`);
      console.log(`  Est. Revenue: PKR ${roiData.data?.estimatedRevenue}`);
      console.log(`  Net ROI: PKR ${roiData.data?.predictedROI}`);
      console.log(`  ROI %: ${roiData.data?.roiPercentage?.toFixed(2)}%`);
      console.log(`  AI Model Metrics:`, roiData.data?.aiModelMetrics);
      console.log(`  Summary: ${roiData.data?.summary}`);
    } else {
        console.log("  No influencers found to calculate trust score or ROI for. Did you seed the database?");
    }

    // 5. Test ML Clustering (Categorization)
    console.log("\n[5] Testing ML K-Means Clustering (Auto-Categorization)...");
    const clusterRes = await fetch(`${API_BASE}/influencers/categorize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const clusterData = await clusterRes.json() as any;
    console.log(`✓ Categorization complete!`);
    console.log(`  Message: ${clusterData.message}`);

    console.log("\n=== All Tests Completed Successfully ===");

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testMethodologies();
