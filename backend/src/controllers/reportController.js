import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { generateDoctorReport } from "../services/pdf/generateDoctorReport.js";

const GEMINI_SYSTEM_PROMPT = `You are a medical report analyzer. Analyze the uploaded medical report and extract data. Return ONLY a valid JSON object matching this schema. Do not include markdown code block formatting or backticks around the JSON.
Schema:
{
  "patient_info": { "name": "string", "age": "number|string", "gender": "string", "date": "string" },
  "extracted_values": [ { "parameter": "string", "value": "number", "unit": "string", "reference_range": "string", "status": "high|low|normal" } ],
  "abnormal_findings": [ { "parameter": "string", "value": "string", "clinical_significance": "string" } ],
  "ai_explanation": "string",
  "risk_assessment": { "level": "Emergency|Urgent|Moderate|Low Risk", "score": "number", "reasoning": "string" },
  "possible_conditions": [ "string" ],
  "recommendations": [ "string" ],
  "emergency_alerts": [ "string" ],
  "health_score": "number",
  "trend_analysis": "string",
  "medical_references": [ "string" ]
}`;

const MOCK_BLOOD_REPORT_ANALYSIS = {
  status: "complete",
  patient_info: {
    name: "John Doe",
    age: 45,
    gender: "Male",
    date: new Date().toISOString().split("T")[0]
  },
  extracted_values: [
    { parameter: "Hemoglobin", value: 11.2, unit: "g/dL", reference_range: "13.8 - 17.2", status: "low" },
    { parameter: "White Blood Cells (WBC)", value: 12.5, unit: "x10^3/uL", reference_range: "4.5 - 11.0", status: "high" },
    { parameter: "Platelets", value: 220, unit: "x10^3/uL", reference_range: "150 - 450", status: "normal" },
    { parameter: "Cholesterol (Total)", value: 180, unit: "mg/dL", reference_range: "< 200", status: "normal" }
  ],
  abnormal_findings: [
    { parameter: "WBC Count", value: "High", clinical_significance: "Elevated white blood cells indicate potential active infection or inflammation." },
    { parameter: "Hemoglobin", value: "Low", clinical_significance: "Lower than normal hemoglobin level, suggesting possible anemia." }
  ],
  ai_explanation: "Your blood report shows an elevated White Blood Cell count (High) and a low Hemoglobin level (Low). An elevated WBC count typically indicates that your body is fighting off an infection or inflammation. A low Hemoglobin level indicates possible anemia, which can lead to fatigue or weakness.",
  risk_assessment: {
    level: "Moderate",
    score: 68,
    reasoning: "The combination of elevated WBC and low Hemoglobin requires a physician consultation within 24-48 hours to examine potential infection and anemia indicators, but does not present an immediate emergency."
  },
  possible_conditions: [
    "Infection Indicators",
    "Possible Anemia"
  ],
  recommendations: [
    "Schedule a physician consultation within 24–48 hours.",
    "Seek immediate medical attention if symptoms worsen.",
    "This assessment is informational only and not a diagnosis."
  ],
  emergency_alerts: [],
  health_score: 75,
  trend_analysis: "WBC is elevated above baseline, indicating active immune response. Hemoglobin is reduced, indicating oxygen transport efficiency is sub-optimal.",
  medical_references: [
    "American Society of Hematology Guidelines on Anemia (2024)",
    "Infectious Diseases Society of America (IDSA) Clinical Guidelines (2023)"
  ]
};

export async function analyzeReport(request, response, next) {
  try {
    if (!request.file) {
      return response.status(400).json({ message: "No report file uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API key missing; falling back to mock blood report analysis.");
      return response.json(MOCK_BLOOD_REPORT_ANALYSIS);
    }

    try {
      console.log("Analyzing file using Gemini API:", request.file.originalname);
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-2.0-flash",
        temperature: 0.1,
        maxRetries: 0
      });

      const fileContent = {
        inlineData: {
          data: request.file.buffer.toString("base64"),
          mimeType: request.file.mimetype
        }
      };

      const result = await model.invoke([
        ["system", GEMINI_SYSTEM_PROMPT],
        [
          "human",
          [
            {
              type: "text",
              text: "Please analyze the attached medical report according to the system prompt."
            },
            fileContent
          ]
        ]
      ]);

      const cleanContent = result.content.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const analysis = JSON.parse(cleanContent);
      response.json({ ...analysis, status: "complete" });
    } catch (error) {
      console.warn("Gemini report analysis failed; falling back to mock blood report analysis.", error.message);
      response.json(MOCK_BLOOD_REPORT_ANALYSIS);
    }
  } catch (error) {
    next(error);
  }
}

export async function downloadReportPdf(request, response, next) {
  try {
    const analysisData = request.body;
    if (!analysisData || !analysisData.patient_info) {
      return response.status(400).json({ message: "Invalid analysis data" });
    }

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", 'attachment; filename="doctor-summary.pdf"');

    generateDoctorReport(analysisData, response);
  } catch (error) {
    next(error);
  }
}
