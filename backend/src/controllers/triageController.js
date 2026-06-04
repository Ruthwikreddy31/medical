import { z } from "zod";
import { storeAuditLog } from "../services/auditLog.js";
import { enrichTriageWithLlm } from "../services/llmService.js";
import { addLocalizedGuidance } from "../services/translationService.js";
import { ragPipeline } from "../services/rag/ragPipeline.js";
import { recommendationAgent } from "../services/agents/recommendationAgent.js";
import { getDb } from "../config/db.js";
import { decryptJson } from "../services/cryptoService.js";

const triageInputSchema = z.object({
  name: z.string().optional().default(""),
  age: z.number().int().min(0).max(125),
  gender: z.string().min(1),
  location: z.string().optional().default(""),
  language: z.string().optional().default("English"),
  medical_conditions: z.array(z.string()).optional().default([]),
  medications: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  symptoms: z.string().min(2),
  duration: z.string().min(1),
  severity: z.number().min(1).max(10),
  additional_notes: z.string().optional().default(""),
  previous_consultation_history: z.string().optional().default("")
});

export async function createTriageSession(request, response, next) {
  try {
    const parsed = triageInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: "Invalid triage input", issues: parsed.error.flatten() });
    }

    const input = parsed.data;
    const retrievedMedicalContext = await ragPipeline(input);
    const baselineTriage = recommendationAgent(input, retrievedMedicalContext);
    const llmTriage = await enrichTriageWithLlm(input, retrievedMedicalContext, baselineTriage);
    const triageResponse = addLocalizedGuidance(llmTriage, input.language);
    const auditLog = await storeAuditLog(input, retrievedMedicalContext, triageResponse, request.user);

    response.json({ ...triageResponse, audit_log: auditLog });
  } catch (error) {
    next(error);
  }
}

export async function getTriageHistory(request, response, next) {
  try {
    const db = await getDb();
    if (!db) {
      return response.json([]);
    }
    const userId = request.user?.sub;
    if (!userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }
    const logs = await db.collection("triage_audit_logs")
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .toArray();

    const decryptedLogs = logs.map(log => {
      const decryptedInput = decryptJson(log.user_input);
      return {
        id: log._id.toString(),
        timestamp: log.timestamp,
        risk_level: log.risk_level,
        recommendations: log.recommendations,
        confidence_score: log.confidence_score,
        user_input: decryptedInput
      };
    });

    response.json(decryptedLogs);
  } catch (error) {
    next(error);
  }
}
