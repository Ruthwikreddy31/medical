const TRIAGE_SYSTEM_PROMPT = `You are an AI Healthcare Triage Assistant.
Use only the retrieved medical context.
Do not diagnose with certainty.
Do not prescribe medications or dosage changes.
Return concise JSON-compatible guidance that prioritizes safety.`;

export async function enrichTriageWithLlm(input, retrievedMedicalContext, baselineResponse) {
  const provider = (process.env.LLM_PROVIDER || "none").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return callOpenAi(input, retrievedMedicalContext, baselineResponse);
  }
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return callGemini(input, retrievedMedicalContext, baselineResponse);
  }
  return baselineResponse;
}

async function callOpenAi(input, retrievedMedicalContext, baselineResponse) {
  try {
    const { ChatOpenAI } = await import("@langchain/openai");
    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.1,
      maxRetries: 0
    });
    const result = await model.invoke(buildPrompt(input, retrievedMedicalContext, baselineResponse));
    return mergeLlmText(baselineResponse, result.content);
  } catch (error) {
    console.warn("OpenAI enrichment unavailable; using baseline triage.", error.message);
    return baselineResponse;
  }
}

async function callGemini(input, retrievedMedicalContext, baselineResponse) {
  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      temperature: 0.1,
      maxRetries: 0
    });

    const result = await Promise.race([
      model.invoke(buildPrompt(input, retrievedMedicalContext, baselineResponse)),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini API call timed out after 10 seconds")), 10000))
    ]);

    return mergeLlmText(baselineResponse, result.content);
  } catch (error) {
    console.warn("Gemini enrichment unavailable; using baseline triage.", error.message);
    return baselineResponse;
  }
}

function buildPrompt(input, retrievedMedicalContext, baselineResponse) {
  return [
    ["system", TRIAGE_SYSTEM_PROMPT],
    [
      "human",
      JSON.stringify(
        {
          patient_input: input,
          retrieved_context: retrievedMedicalContext,
          baseline_triage: baselineResponse
        },
        null,
        2
      )
    ]
  ];
}

function mergeLlmText(baselineResponse, content) {
  const llmNote = Array.isArray(content)
    ? content.map((part) => part.text || "").join(" ")
    : String(content || "").trim();

  if (!llmNote) {
    return baselineResponse;
  }

  return {
    ...baselineResponse,
    llm_review: {
      used: true,
      summary: llmNote.slice(0, 1200)
    }
  };
}
