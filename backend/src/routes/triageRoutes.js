import { Router } from "express";
import { createTriageSession, getTriageHistory } from "../controllers/triageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", requireAuth, createTriageSession);
router.get("/history", requireAuth, getTriageHistory);

export default router;
