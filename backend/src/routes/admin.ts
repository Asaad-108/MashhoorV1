import { Router } from "express";
import { getAdminStats, getPendingVerifications, verifyUser } from "../controllers/adminController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/stats", getAdminStats);
router.get("/verifications/pending", getPendingVerifications);
router.put("/verifications/:id/approve", verifyUser);

export default router;
