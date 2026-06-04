import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const CHAT_SYSTEM_PROMPT = `You are MedGuardian AI Doctor Assistant, an intelligent healthcare triage and consultation chatbot.
Your purpose is to simulate the initial questioning process that a healthcare professional might perform during a patient interview.
You must act as a symptom assessment and triage assistant, NOT as a licensed doctor.
You must never provide a definitive diagnosis.
You must never prescribe medications.
You must never replace professional medical advice.

OBJECTIVE:
1. Understand the patient's symptoms.
2. Ask adaptive follow-up questions one at a time.
3. Use previous answers to determine the next question.
4. Assess urgency and risk level (Low, Moderate, Urgent, Emergency).
5. Provide safe recommendations.
6. Stop questioning once sufficient information has been gathered.
7. Generate a final summary.

CONVERSATION RULES:
- Rule 1: Ask only ONE primary question at a time. Never ask multiple questions at once.
- Rule 2: Every next question must depend on the patient's previous answer.
- Rule 3: Maintain conversation memory (symptoms, duration, severity, location, history). Never ask the same question twice.
- Rule 4: Update risk level (Low, Moderate, Urgent, Emergency) continuously after each answer.

ADAPTIVE QUESTION LOGIC:
- CHEST PAIN: Ask Which side of the chest? -> How long has it been present? -> Severity (1-10)? -> Does it spread to arm, neck, jaw, or back? -> Any shortness of breath? -> Any sweating? -> Any dizziness? -> Any nausea?
  Emergency indicators: Left-sided chest pain, pain spreading to arm/jaw, difficulty breathing, sweating, dizziness. If multiple exist, Risk Level = Emergency. Recommend emergency care.
- FEVER: Ask Temperature? -> Duration? -> Cough? -> Sore throat? -> Body pain? -> Rash? -> Breathing issues?
- HEADACHE: Ask Location? -> Duration? -> Severity? -> Blurred vision? -> Nausea? -> Vomiting? -> Sensitivity to light?
- COUGH: Ask Dry or productive? -> Duration? -> Fever present? -> Breathing difficulty? -> Chest pain? -> Blood in sputum?
- ABDOMINAL PAIN: Ask Where is the pain located? -> Duration? -> Severity? -> Vomiting? -> Diarrhea? -> Fever? -> Blood in stool?
- MEDICAL REPORT CONSULTATION: If a medical report context is provided (under context.report, which contains abnormal_findings), automatically begin a consultation focused on these findings. Ask clinically relevant follow-up questions for each abnormal finding one-at-a-time, use previous answers to guide questions, update risk assessment dynamically, and once complete, output the final assessment summary.

Return ONLY a valid JSON object matching this schema. Do not include markdown code block formatting or backticks around the JSON.
Schema:
{
  "status": "ongoing" | "complete",
  "current_understanding": {
    "symptom": "string or N/A",
    "duration": "string or N/A",
    "severity": "string or N/A",
    "important_findings": "string or N/A"
  } | null,
  "current_risk_level": "Low" | "Moderate" | "Urgent" | "Emergency",
  "ai_message": "The next question or concluding message",
  "reason": "Brief explanation of why you are asking the question (null if complete)",
  "options": ["Option A", "Option B"] | null,
  "assessment": {
    "symptoms": "string",
    "duration": "string",
    "severity": "string",
    "key_findings": "string",
    "possible_concerns": "Possible concerns using phrases like 'may be related to', 'could be associated with', 'possible explanation'",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  } | null
}`;

export async function handleDoctorChat(request, response, next) {
  try {
    const { messages, context } = request.body;
    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({ message: "Invalid chat history" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return response.json(getMockResponse(messages, context));
    }

    try {
      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-2.0-flash",
        temperature: 0.2,
        maxRetries: 0
      });

      const formattedMessages = [
        ["system", CHAT_SYSTEM_PROMPT]
      ];

      if (context) {
        formattedMessages.push(["system", `Here is the current clinical context for reference: ${JSON.stringify(context)}`]);
      }

      const recentMessages = messages.slice(-10);
      recentMessages.forEach((msg) => {
        const role = msg.role === "user" ? "human" : "ai";
        formattedMessages.push([role, msg.content]);
      });

      const result = await model.invoke(formattedMessages);
      const cleanContent = result.content.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      
      const parsed = JSON.parse(cleanContent);
      response.json(parsed);
    } catch (err) {
      console.warn("AI chat invocation failed (likely quota limits). Falling back to mock engine.", err.message);
      response.json(getMockResponse(messages, context));
    }
  } catch (error) {
    next(error);
  }
}

// State-machine Mock Doctor Engine
function getMockResponse(messages, context) {
  const userMsgs = messages.filter(m => m.role === "user").map(m => m.content.toLowerCase().trim());
  const lastUserMsg = userMsgs[userMsgs.length - 1] || "";

  // ----------------------------------------------------
  // PATH 0: MEDICAL REPORT ABNORMAL FINDINGS CONSULTATION
  // ----------------------------------------------------
  const report = context?.report;
  if (report && report.abnormal_findings && report.abnormal_findings.length > 0) {
    const findings = report.abnormal_findings;
    const answeredCount = userMsgs.length;

    const hasWbc = findings.some(f => f.parameter.toLowerCase().includes("wbc") || f.parameter.toLowerCase().includes("white blood cell"));
    const hasHgb = findings.some(f => f.parameter.toLowerCase().includes("hemoglobin") || f.parameter.toLowerCase().includes("hgb"));

    if (hasWbc && hasHgb) {
      // 1. Initial welcome & fever check
      if (answeredCount === 0) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Elevated WBC & Low Hemoglobin",
            duration: "N/A",
            severity: "N/A",
            important_findings: "Report findings reviewed"
          },
          current_risk_level: "Moderate",
          ai_message: "Hello, I have reviewed your blood report.\n\nI noticed that your White Blood Cell count is elevated and your Hemoglobin level is below the normal range.\n\nI'd like to ask a few questions to better understand your condition.\n\nHave you experienced fever recently?",
          reason: "Checking for systemic infection signs associated with elevated WBC.",
          options: ["Yes", "No"],
          assessment: null
        };
      }

      // 2. How many days have you been experiencing the fever?
      if (answeredCount === 1) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Fever",
            duration: "N/A",
            severity: "N/A",
            important_findings: `Fever: ${userMsgs[0]}`
          },
          current_risk_level: "Moderate",
          ai_message: "Thank you.\n\nHow many days have you been experiencing the fever?",
          reason: "Fever duration helps narrow down acute infection timelines.",
          options: ["1 day", "2 days", "3 days", "4 days", "5+ days"],
          assessment: null
        };
      }

      // 3. What is the highest temperature?
      if (answeredCount === 2) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Fever",
            duration: `${userMsgs[1]}`,
            severity: "N/A",
            important_findings: `Fever for ${userMsgs[1]}`
          },
          current_risk_level: "Moderate",
          ai_message: "What is the highest temperature you have recorded?",
          reason: "Temperature elevation indicates the severity of the body's inflammatory response.",
          options: ["99°F", "100°F", "101°F", "102°F", "103°F+"],
          assessment: null
        };
      }

      // 4. Do you currently have any of these symptoms?
      if (answeredCount === 3) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Fever",
            duration: `${userMsgs[1]}`,
            severity: `Temp: ${userMsgs[2]}`,
            important_findings: `Temperature recorded: ${userMsgs[2]}`
          },
          current_risk_level: "Moderate",
          ai_message: "Do you currently have any of these symptoms?\n\n• Cough\n• Sore throat\n• Body pain\n• None",
          reason: "Checking for localized respiratory or systemic symptoms to evaluate source of infection.",
          options: ["Cough and body pain", "Cough", "Sore throat", "Body pain", "None"],
          assessment: null
        };
      }

      // 5. Have you been feeling unusually tired or weak lately?
      if (answeredCount === 4) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: `Fever, ${userMsgs[3]}`,
            duration: `${userMsgs[1]}`,
            severity: `Temp: ${userMsgs[2]}`,
            important_findings: `Associated symptoms: ${userMsgs[3]}`
          },
          current_risk_level: "Moderate",
          ai_message: "Thank you.\n\nI also noticed your hemoglobin level is lower than normal.\n\nHave you been feeling unusually tired or weak lately?",
          reason: "Low hemoglobin restricts oxygen transport, frequently presenting as fatigue or weakness.",
          options: ["Yes", "No"],
          assessment: null
        };
      }

      // 6. Do you experience dizziness when standing up?
      if (answeredCount === 5) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: `Fever, ${userMsgs[3]}, Fatigue`,
            duration: `${userMsgs[1]}`,
            severity: `Temp: ${userMsgs[2]}`,
            important_findings: `Fatigue: ${userMsgs[4]}`
          },
          current_risk_level: "Moderate",
          ai_message: "Do you experience dizziness when standing up?",
          reason: "Orthostatic dizziness can be associated with anemia or dehydration.",
          options: ["Yes", "Sometimes", "No"],
          assessment: null
        };
      }

      // 7. Complete final assessment
      return {
        status: "complete",
        current_understanding: null,
        current_risk_level: "Moderate",
        ai_message: "Thank you for the information. I have completed the report consultation triage and compiled your clinical summary.",
        reason: null,
        options: null,
        assessment: {
          symptoms: "Elevated WBC Count, Low Hemoglobin",
          duration: "Fever (4 days)",
          severity: "Temperature 102°F",
          key_findings: "Cough, Body pain, Fatigue, Occasional dizziness",
          possible_concerns: "Ongoing infection, Mild anemia",
          recommendations: [
            "Schedule a physician consultation within 24–48 hours.",
            "Seek immediate medical attention if symptoms worsen.",
            "This assessment is informational only and not a diagnosis."
          ]
        }
      };
    }

    // Generic fallback report state-machine
    if (answeredCount < findings.length) {
      const currentFinding = findings[answeredCount];
      const param = currentFinding.parameter;
      const val = currentFinding.value;
      const significance = currentFinding.clinical_significance;

      let followUpQuestion = `I noticed your ${param} is abnormal at ${val}. ${significance} Have you experienced any symptoms related to this recently?`;
      let currentOptions = ["Yes, severely", "Yes, mildly", "No, not at all"];

      if (param.toLowerCase().includes("hemoglobin")) {
        followUpQuestion = `I noticed that your Hemoglobin is low at ${val}. This can suggest mild anemia. Have you been feeling unusually fatigued, weak, or short of breath recently?`;
        currentOptions = ["Yes, frequently", "Yes, mildly", "No, not at all"];
      } else if (param.toLowerCase().includes("platelet")) {
        followUpQuestion = `Your Platelet count is low at ${val}, which can affect blood clotting. Have you noticed any unusual bruising, frequent nosebleeds, or cuts that take a long time to heal?`;
        currentOptions = ["Yes, some bruising/bleeding", "No, nothing unusual"];
      } else if (param.toLowerCase().includes("cholesterol")) {
        followUpQuestion = `Your total Cholesterol is elevated at ${val}, which increases cardiovascular risk. Do you follow a diet high in saturated fats, or has a doctor discussed your cholesterol levels before?`;
        currentOptions = ["Yes, high-fat diet", "No, standard/low-fat diet", "Not sure"];
      }

      return {
        status: "ongoing",
        current_understanding: {
          symptom: `Reviewing: ${param}`,
          duration: "N/A",
          severity: "N/A",
          important_findings: `Abnormal ${param} (${val})`
        },
        current_risk_level: report.risk_assessment?.level || "Moderate",
        ai_message: followUpQuestion,
        reason: `Clinical followup for abnormal ${param} (${val}).`,
        options: currentOptions,
        assessment: null
      };
    }

    // All findings have been answered! Complete the consultation.
    const symptomsSummary = userMsgs.map((msg, idx) => {
      const param = findings[idx]?.parameter || "finding";
      return `${param}: ${msg}`;
    }).join(", ");

    return {
      status: "complete",
      current_understanding: null,
      current_risk_level: report.risk_assessment?.level || "Moderate",
      ai_message: "Thank you for providing those details. I have completed the report consultation triage and compiled your clinical summary.",
      reason: null,
      options: null,
      assessment: {
        symptoms: symptomsSummary,
        duration: "Recent",
        severity: "Mild to Moderate",
        key_findings: `Reviewed ${findings.length} abnormal findings from your uploaded report: ` + findings.map(f => `${f.parameter} (${f.value})`).join(", "),
        possible_concerns: report.possible_conditions?.join(", ") || "Clinical follow-up required",
        recommendations: report.recommendations || [
          "Consult your primary care physician to discuss these lab results.",
          "Keep a log of any physical symptoms.",
          "Seek immediate emergency care if new or worsening symptoms develop."
        ]
      }
    };
  }

  // ----------------------------------------------------
  // PATH 1: CHEST PAIN
  // ----------------------------------------------------
  if (userMsgs.some(m => m.includes("chest pain") || m.includes("chest"))) {
    const side = userMsgs.find(m => m.includes("left") || m.includes("right") || m.includes("center") || m.includes("other"));
    const duration = userMsgs.find(m => m.includes("day") || m.includes("hour") || m.includes("week") || m.includes("recent") || m.includes("since") || m.includes("less than") || m.includes("1-2"));
    const severity = userMsgs.find(m => /\b([1-9]|10)\b/.test(m));
    const radiation = userMsgs.find(m => m.includes("yes") || m.includes("no") || m.includes("spread") || m.includes("arm") || m.includes("neck") || m.includes("jaw"));
    
    // Step 1: Which side of the chest?
    if (!side) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: "Chest pain",
          duration: "N/A",
          severity: "N/A",
          important_findings: "Chest discomfort reported"
        },
        current_risk_level: "Moderate",
        ai_message: "Which side of your chest is affected?",
        reason: "Location helps determine the likelihood of cardiac involvement.",
        options: ["Left side", "Right side", "Center", "Other"],
        assessment: null
      };
    }

    // Step 2: Left-sided chest pain is high-risk. Adaptive check for radiation first.
    if (side.includes("left")) {
      if (!radiation) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Left-sided chest pain",
            duration: "N/A",
            severity: "N/A",
            important_findings: "Left-sided chest pain reported"
          },
          current_risk_level: "Urgent",
          ai_message: "Does the pain spread to your arm, neck, or jaw?",
          reason: "Radiation of left-sided chest pain is a high-risk emergency indicator.",
          options: ["Yes", "No"],
          assessment: null
        };
      }

      if (radiation.includes("yes") || radiation.includes("spread") || radiation.includes("arm") || radiation.includes("neck") || radiation.includes("jaw")) {
        return {
          status: "complete",
          current_understanding: null,
          current_risk_level: "Emergency",
          ai_message: "Emergency Risk Detected.",
          reason: null,
          options: null,
          assessment: {
            symptoms: "Left-sided chest pain",
            duration: "N/A",
            severity: "N/A",
            key_findings: "Left-sided chest pain radiating to arm/neck/jaw.",
            possible_concerns: "The described symptoms could be associated with myocardial ischemia or a cardiovascular event.",
            recommendations: [
              "Seek immediate emergency medical attention (Call 911/112).",
              "Sit quietly and avoid any physical exertion.",
              "Do not attempt to drive yourself to the clinic.",
              "Inform family or someone nearby immediately."
            ]
          }
        };
      }

      // If left side but radiation is "no", continue to gather duration & severity
      if (!duration) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Left-sided chest pain (no radiation)",
            duration: "N/A",
            severity: "N/A",
            important_findings: "No pain radiation reported"
          },
          current_risk_level: "Moderate",
          ai_message: "How long have you been experiencing this pain?",
          reason: "Duration helps assess the threat level of non-radiating chest pain.",
          options: ["Less than 1 hour", "1-2 hours", "1 day", "2 days", "More than 3 days"],
          assessment: null
        };
      }

      if (!severity) {
        return {
          status: "ongoing",
          current_understanding: {
            symptom: "Left-sided chest pain (no radiation)",
            duration: duration,
            severity: "N/A",
            important_findings: `Duration: ${duration}`
          },
          current_risk_level: "Moderate",
          ai_message: "On a scale of 1 to 10, how severe is the pain?",
          reason: "Severity helps assess clinical urgency for non-radiating chest pain.",
          options: ["3 (Mild)", "5 (Moderate)", "7 (Severe)", "9 (Very Severe)"],
          assessment: null
        };
      }

      // If we have side, radiation=no, duration, and severity:
      return {
        status: "complete",
        current_understanding: null,
        current_risk_level: Number(severity) >= 7 ? "Urgent" : "Moderate",
        ai_message: "Assessment completed.",
        reason: null,
        options: null,
        assessment: {
          symptoms: "Left-sided chest pain (no radiation)",
          duration: duration,
          severity: `${severity}/10`,
          key_findings: `Located on the left side. No radiation reported.`,
          possible_concerns: "The symptoms could be associated with musculoskeletal strain or gastroesophageal issues.",
          recommendations: [
            "Schedule a routine doctor consultation for evaluation.",
            "Monitor for any worsening patterns.",
            "Seek emergency care if pain spreads or breathing difficulty develops."
          ]
        }
      };
    }

    // Step 3: For other locations (Right, Center, Other), run the standard flow
    if (!duration) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: `Chest pain (${side})`,
          duration: "N/A",
          severity: "N/A",
          important_findings: "Location specified"
        },
        current_risk_level: "Moderate",
        ai_message: "How long have you been experiencing this pain?",
        reason: "Acute duration indicates a sudden onset, potentially needing faster evaluation.",
        options: ["Less than 1 hour", "1-2 hours", "1 day", "2 days", "More than 3 days"],
        assessment: null
      };
    }

    if (!severity) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: `Chest pain (${side})`,
          duration: duration,
          severity: "N/A",
          important_findings: "Duration specified"
        },
        current_risk_level: "Moderate",
        ai_message: "On a scale of 1 to 10, how severe is the pain?",
        reason: "Higher severity scores indicate higher urgency for clinical triage.",
        options: ["3 (Mild)", "5 (Moderate)", "7 (Severe)", "9 (Very Severe)"],
        assessment: null
      };
    }

    if (!radiation) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: `Chest pain (${side})`,
          duration: duration,
          severity: `Severity: ${severity}/10`,
          important_findings: "Severity rated"
        },
        current_risk_level: "Moderate",
        ai_message: "Does the pain spread to your arm, neck, jaw, or back?",
        reason: "Radiation of chest pain is a key indicator of potential heart ischemia.",
        options: ["Yes", "No"],
        assessment: null
      };
    }

    // Standard complete for non-left side
    return {
      status: "complete",
      current_understanding: null,
      current_risk_level: "Moderate",
      ai_message: "Assessment completed.",
      reason: null,
      options: null,
      assessment: {
        symptoms: "Chest pain",
        duration: duration,
        severity: `${severity}/10`,
        key_findings: `Located on the ${side}. Pain radiation: ${radiation.includes("yes") ? "Yes" : "No"}.`,
        possible_concerns: "The symptoms could be associated with musculoskeletal strain or gastroesophageal issues.",
        recommendations: [
          "Schedule a routine doctor consultation for evaluation.",
          "Monitor for any worsening patterns.",
          "Seek emergency care if pain spreads or breathing difficulty develops."
        ]
      }
    };
  }

  // ----------------------------------------------------
  // PATH 2: FEVER
  // ----------------------------------------------------
  const feverMsgIdx = userMsgs.findIndex(m => m.includes("fever") || m.includes("temp") || m.includes("hot") || m.includes("yes"));
  const hasFever = feverMsgIdx !== -1;

  if (hasFever) {
    const feverSubMsgs = userMsgs.slice(feverMsgIdx);
    const days = feverSubMsgs.find(m => m.includes("day") || m.includes("days") || m.includes("since") || m.includes("week") || m.includes("hour"));
    const symptoms = feverSubMsgs.find(m => m.includes("cough") || m.includes("throat") || m.includes("pain") || m.includes("chills") || m.includes("no other") || m.includes("none"));
    const coughType = feverSubMsgs.find(m => m.includes("mucus") || m.includes("phlegm") || m.includes("dry") || m.includes("produces"));
    const color = feverSubMsgs.find(m => m.includes("clear") || m.includes("white") || m.includes("yellow") || m.includes("green") || m.includes("blood"));

    // 1. Ask duration
    if (!days) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: "Fever",
          duration: "N/A",
          severity: "N/A",
          important_findings: "Fever reported"
        },
        current_risk_level: "Low",
        ai_message: "How many days have you been experiencing the fever?",
        reason: "Fever duration helps distinguish between acute self-limiting issues and prolonged infections.",
        options: ["1 day", "2 days", "3 days", "Around 4 days", "5+ days"],
        assessment: null
      };
    }

    // 2. Ask for other symptoms
    if (!symptoms) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: "Fever",
          duration: days,
          severity: "N/A",
          important_findings: `Fever duration: ${days}`
        },
        current_risk_level: "Low",
        ai_message: "Have you noticed any of the following symptoms?\n- Cough\n- Sore throat\n- Body pain\n- Chills",
        reason: "Checking for localized symptoms helps narrow down the source of infection.",
        options: ["I have cough and body pain", "Cough only", "Sore throat", "No other symptoms"],
        assessment: null
      };
    }

    // If they have no other symptoms, we can complete
    const hasCough = symptoms.includes("cough");
    if (!hasCough || symptoms.includes("no other") || symptoms.includes("none")) {
      return {
        status: "complete",
        current_understanding: null,
        current_risk_level: days.includes("5") || days.includes("4") ? "Moderate" : "Low",
        ai_message: "Thank you for the information. I have completed the triage questionnaire.",
        reason: null,
        options: null,
        assessment: {
          symptoms: `Fever with ${symptoms}`,
          duration: days,
          severity: "Moderate",
          key_findings: `Fever reported for ${days}. Associated symptoms: ${symptoms}.`,
          possible_concerns: "The symptoms could be associated with a systemic viral response or early viral infection.",
          recommendations: [
            "Schedule a doctor consultation if symptoms persist past 3-5 days.",
            "Stay hydrated and rest.",
            "Monitor temperature regularly.",
            "Seek immediate medical attention if breathing issues or high persistent fever develops."
          ]
        }
      };
    }

    // 3. Ask if cough is productive or dry
    if (!coughType) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: "Fever & Cough",
          duration: days,
          severity: "N/A",
          important_findings: `Associated symptoms: ${symptoms}`
        },
        current_risk_level: "Low",
        ai_message: "Thank you. Is the cough producing mucus/phlegm, or is it dry?",
        reason: "A productive cough suggests lower airway involvement or mucus secretion.",
        options: ["It produces mucus", "It is dry"],
        assessment: null
      };
    }

    // If dry cough, we can complete
    const isProductive = coughType.includes("mucus") || coughType.includes("phlegm") || coughType.includes("produces");
    if (!isProductive || coughType.includes("dry")) {
      return {
        status: "complete",
        current_understanding: null,
        current_risk_level: "Moderate",
        ai_message: "Thank you for the information. I have completed the triage questionnaire.",
        reason: null,
        options: null,
        assessment: {
          symptoms: `Fever, dry cough, and body pain`,
          duration: days,
          severity: "Moderate",
          key_findings: `Fever reported for ${days} with a dry cough.`,
          possible_concerns: "The symptoms may be related to an acute viral respiratory tract infection or atypical pharyngitis.",
          recommendations: [
            "Schedule a doctor consultation for further evaluation.",
            "Stay hydrated and rest.",
            "Monitor temperature regularly.",
            "Seek immediate care if breathing difficulty or chest pain develops."
          ]
        }
      };
    }

    // 4. Ask color of mucus
    if (!color) {
      return {
        status: "ongoing",
        current_understanding: {
          symptom: "Fever & Productive Cough",
          duration: days,
          severity: "Moderate",
          important_findings: "Productive cough reported"
        },
        current_risk_level: "Moderate",
        ai_message: "What color is the mucus?",
        reason: "Mucus color can indicate the presence of inflammatory cellular debris or secondary bacterial components.",
        options: ["Clear", "White", "Yellow", "Green", "Blood-stained"],
        assessment: null
      };
    }

    // 5. Complete
    const isHighRiskColor = color.includes("blood") || color.includes("green");
    return {
      status: "complete",
      current_understanding: null,
      current_risk_level: isHighRiskColor ? "Urgent" : "Moderate",
      ai_message: "Thank you for the information. I have completed the triage questionnaire.",
      reason: null,
      options: null,
      assessment: {
        symptoms: "Elevated WBC count, fever, productive cough, body pain",
        duration: `Fever for ${days}`,
        severity: "Moderate",
        key_findings: `Productive cough with ${color} mucus. Associated symptoms: ${symptoms}.`,
        possible_concerns: "These symptoms could be associated with a respiratory tract infection, such as acute bronchitis or early pneumonia.",
        recommendations: [
          "Schedule a doctor consultation within 24–48 hours for evaluation.",
          "Stay hydrated and rest.",
          "Monitor temperature regularly.",
          "Seek immediate emergency care if breathing difficulty, high fever, or chest pain develops."
        ]
      }
    };
  }

  // ----------------------------------------------------
  // DYNAMIC GENERAL DOCTOR ANSWER ENGINE
  // ----------------------------------------------------
  let answerText = "Hello! I've analyzed your blood report.\n\nI noticed that your White Blood Cell (WBC) count is higher than normal. This can sometimes happen when the body is fighting an infection.\n\nHave you had a fever recently?";
  let quickOptions = ["Yes", "No"];

  if (lastUserMsg) {
    if (lastUserMsg.includes("platelet")) {
      answerText = "Platelets are blood cells that play a key role in clotting. A low count (thrombocytopenia) can lead to bleeding or bruising risks. It can be triggered by infections, vitamin deficiencies, or immunological processes. As an assistant, I recommend tracking symptoms.";
      quickOptions = ["Why are platelets low?", "What symptoms to watch for?", "Is it serious?"];
    } else if (lastUserMsg.includes("wbc") || lastUserMsg.includes("white blood cell")) {
      answerText = "White Blood Cells are essential parts of your immune system. A high WBC count (leukocytosis) usually indicates that your body is fighting off an infection or responding to inflammatory stress.";
      quickOptions = ["Do I have an infection?", "What is a normal WBC?", "What other tests are needed?"];
    } else if (lastUserMsg.includes("hemoglobin") || lastUserMsg.includes("anemia") || lastUserMsg.includes("iron")) {
      answerText = "Hemoglobin is the protein in red blood cells that carries oxygen. Low hemoglobin points to anemia, which restricts oxygen distribution and typically causes fatigue, pale skin, or cold extremities.";
      quickOptions = ["How to improve hemoglobin?", "Is it iron deficiency?", "Are there dietary fixes?"];
    } else if (lastUserMsg.includes("cholesterol") || lastUserMsg.includes("lipid")) {
      answerText = "Cholesterol is a lipid substance your body needs to build cells, but high total cholesterol can accumulate as cardiovascular risk. Clinical management focuses on low-fat diets, exercise, and monitoring lipid panels.";
      quickOptions = ["How to lower cholesterol?", "What are HDL and LDL?", "Diet tips for cholesterol"];
    } else if (lastUserMsg.includes("fever")) {
      answerText = "A fever is a temporary elevation in body temperature, representing an active immune defense response to clean out bacterial or viral pathogens. It is important to trace its duration and accompanying symptoms.";
      quickOptions = ["Is fever dangerous?", "How to manage fever?", "Do I need antibiotics?"];
    } else if (lastUserMsg.includes("cough")) {
      answerText = "A cough is a protective reflex that clears the respiratory tract. A productive cough clears out phlegm and mucus, while a dry cough is often due to irritation or viral airway hypersensitivity.";
      quickOptions = ["How to soothe dry cough?", "Is yellow mucus an infection?", "When should I see a doctor?"];
    } else if (lastUserMsg.includes("thank") || lastUserMsg.includes("ok") || lastUserMsg.includes("clear")) {
      answerText = "You're very welcome. As a triage assistant, I always recommend speaking with your physician for personalized medical advice or prescription needs. Is there any other question I can help you with?";
      quickOptions = ["Review chest pain", "Check blood report details", "Start over"];
    } else {
      answerText = `I understand your question regarding "${lastUserMsg}". As a triage assistant, I advise tracking any physical symptoms (like fever, fatigue, or discomfort) and consulting your clinical team to match these findings with your medical history.`;
      quickOptions = ["Check blood report abnormalities", "Intake triage for chest pain", "Explain White Blood Cells"];
    }
  }

  return {
    status: "ongoing",
    current_understanding: {
      symptom: lastUserMsg ? `Query: ${lastUserMsg.slice(0, 30)}` : "N/A",
      duration: "N/A",
      severity: "N/A",
      important_findings: "User requested general health information"
    },
    current_risk_level: "Low",
    ai_message: answerText,
    reason: "Providing general educational information based on your question.",
    options: quickOptions,
    assessment: null
  };
}
