const SAFETY_DISCLAIMER =
  "This AI assistant provides informational guidance only and is not a substitute for professional medical advice, diagnosis, or treatment. Seek immediate medical attention for emergencies.";

const EMERGENCY_TERMS = [
  "chest pain",
  "difficulty breathing",
  "shortness of breath",
  "stroke",
  "severe bleeding",
  "unconscious",
  "confusion",
  "seizure",
  "blue lips"
];

const URGENT_TERMS = [
  "high fever",
  "persistent vomiting",
  "severe pain",
  "dehydration",
  "blood",
  "worsening",
  "stiff neck"
];

export function generateTriageResponse(input, retrievedMedicalContext) {
  const symptoms = extractSymptoms(input.symptoms);
  const urgency = classifyUrgency(input, symptoms);

  return {
    patient_summary: {
      age: input.age,
      gender: input.gender,
      symptoms,
      duration: input.duration,
      severity: input.severity
    },
    retrieved_medical_context: retrievedMedicalContext,
    risk_assessment: {
      urgency_level: urgency.label,
      confidence_score: urgency.confidence,
      reasoning: urgency.reasoning
    },
    possible_conditions: buildPossibleCauses(symptoms, retrievedMedicalContext),
    recommendations: buildRecommendations(urgency.label),
    doctor_visit_recommendation: {
      required: urgency.label !== "Low Risk",
      timeline: urgency.timeline
    },
    safety_disclaimer: SAFETY_DISCLAIMER
  };
}

function extractSymptoms(symptomText) {
  return symptomText
    .split(/[,;\n]+/)
    .map((symptom) => symptom.trim())
    .filter(Boolean);
}

function classifyUrgency(input, symptoms) {
  const text = `${input.symptoms} ${input.additional_notes}`.toLowerCase();
  const hasEmergencyTerm = EMERGENCY_TERMS.some((term) => text.includes(term));
  const hasUrgentTerm = URGENT_TERMS.some((term) => text.includes(term));
  const hasRiskHistory = input.medical_conditions.some((condition) =>
    ["diabetes", "heart disease", "asthma", "copd", "pregnancy"].includes(condition.toLowerCase())
  );

  if (hasEmergencyTerm || input.severity >= 9) {
    return {
      label: "Emergency",
      confidence: "0.90",
      timeline: "Seek emergency care immediately.",
      reasoning: "The symptoms or severity include emergency warning signs that require immediate medical evaluation."
    };
  }

  if (hasUrgentTerm || input.severity >= 7 || (hasRiskHistory && input.severity >= 6)) {
    return {
      label: "Urgent",
      confidence: "0.78",
      timeline: "Visit a doctor or urgent care service within 24 hours.",
      reasoning: "The symptom severity, duration, or medical history suggests a need for prompt professional assessment."
    };
  }

  if (input.severity >= 4 || symptoms.length >= 3) {
    return {
      label: "Moderate",
      confidence: "0.70",
      timeline: "Schedule a doctor consultation, especially if symptoms persist or worsen.",
      reasoning: "The symptoms appear non-emergency but still warrant monitoring and planned medical review."
    };
  }

  return {
    label: "Low Risk",
    confidence: "0.64",
    timeline: "Home care and monitoring may be reasonable, with consultation if symptoms continue.",
    reasoning: "Current symptoms are mild based on provided severity and lack of warning signs."
  };
}

function buildPossibleCauses(symptoms, retrievedMedicalContext) {
  const contextCauses = retrievedMedicalContext
    .map((context) => context.source.replace(/^doc-/, "").replaceAll("-", " "))
    .slice(0, 3);

  return [
    ...new Set([
      ...contextCauses,
      symptoms.length ? "Symptom pattern requires clinician review for confirmation" : "Insufficient symptom details"
    ])
  ];
}

function buildRecommendations(urgencyLevel) {
  const shared = [
    "Stay hydrated unless a clinician has told you to restrict fluids.",
    "Rest and monitor symptom changes, including temperature, breathing, pain level, and alertness.",
    "Avoid changing prescription medicines or dosages without speaking to a qualified clinician."
  ];

  if (urgencyLevel === "Emergency") {
    return [
      "Seek immediate emergency medical care now.",
      "Do not delay care while waiting for online advice.",
      ...shared
    ];
  }

  if (urgencyLevel === "Urgent") {
    return [
      "Arrange medical evaluation within 24 hours.",
      "Seek emergency care sooner if breathing difficulty, chest pain, fainting, confusion, severe bleeding, or rapidly worsening symptoms occur.",
      ...shared
    ];
  }

  if (urgencyLevel === "Moderate") {
    return [
      "Schedule a doctor consultation if symptoms persist, worsen, or new symptoms appear.",
      "Use home monitoring and supportive care while watching for emergency warning signs.",
      ...shared
    ];
  }

  return [
    "Use home care and observe symptoms closely.",
    "Contact a healthcare professional if symptoms last longer than expected or become more severe.",
    ...shared
  ];
}
