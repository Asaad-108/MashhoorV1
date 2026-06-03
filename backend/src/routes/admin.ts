import { Router } from "express";
import { getAdminStats } from "../controllers/adminController";
import { protect, authorize } from "../middleware/auth";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/stats", getAdminStats);

export default router;
