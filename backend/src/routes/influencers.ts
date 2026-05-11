import { Router } from "express";
import {
  getInfluencers,
  getInfluencerById,
  updateMyProfile,
  recomputeTrustScore,
} from "../controllers/influencerController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// ⚠️  FIXED: /profile and specific routes MUST come before /:id
// otherwise Express matches /profile as an id param

// Influencer manages their own profile
router.put("/profile", protect, authorize("influencer"), updateMyProfile);

// Business browses influencers
router.get("/", protect, authorize("business"), getInfluencers);

// Internal: AI service updates trust score
router.post("/:id/trust-score", protect, authorize("business"), recomputeTrustScore);

// Parameterized route LAST
router.get("/:id", protect, getInfluencerById);

export default router;
