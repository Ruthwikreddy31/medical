import { Router } from "express";
import multer from "multer";
import { analyzeReport, downloadReportPdf } from "../controllers/reportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post("/analyze", requireAuth, upload.single("report"), analyzeReport);
router.post("/download-pdf", requireAuth, downloadReportPdf);

export default router;
