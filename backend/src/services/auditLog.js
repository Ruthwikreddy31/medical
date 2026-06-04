import { getDb } from "../config/db.js";
import { encryptJson } from "./cryptoService.js";

export async function storeAuditLog(input, retrievedDocuments, triageResponse, user) {
  const timestamp = new Date().toISOString();
  const protectedUserInput = encryptJson(redactSensitiveInput(input));
  const auditLog = {
    timestamp,
    user_id: user?.sub || null,
    user_input: protectedUserInput,
    documents_used: retrievedDocuments.map((document) => document.source),
    risk_level: triageResponse.risk_assessment.urgency_level,
    recommendations: triageResponse.recommendations,
    confidence_score: triageResponse.risk_assessment.confidence_score
  };

  try {
    const db = await getDb();
    if (db) {
      await db.collection("triage_audit_logs").insertOne(auditLog);
    }
  } catch (error) {
    console.warn("Audit log persistence unavailable; returning in-memory audit log.", error.message);
  }

  return auditLog;
}

function redactSensitiveInput(input) {
  return {
    age: input.age,
    gender: input.gender,
    location: input.location,
    language: input.language,
    medical_conditions: input.medical_conditions,
    medications: input.medications.map(() => "[redacted]"),
    allergies: input.allergies,
    symptoms: input.symptoms,
    duration: input.duration,
    severity: input.severity
  };
}
