import { Router } from "express";
import { handleDoctorChat } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", requireAuth, handleDoctorChat);

export default router;
