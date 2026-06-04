import { Router } from "express";
import { getNearestHospitals } from "../controllers/hospitalController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/nearest", requireAuth, getNearestHospitals);

export default router;
