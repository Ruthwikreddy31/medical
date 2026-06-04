import dotenv from "dotenv";
dotenv.config();

async function testGemini() {
  console.log("Loading @langchain/google-genai...");
  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    console.log("Instantiating ChatGoogleGenerativeAI with API Key:", process.env.GEMINI_API_KEY ? "Present (Starts with " + process.env.GEMINI_API_KEY.substring(0, 5) + ")" : "Missing");
    
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      temperature: 0.1
    });

    console.log("Invoking model...");
    const start = Date.now();
    const result = await model.invoke([
      ["system", "You are a helpful assistant."],
      ["human", "Hello! Respond with 'test success'."]
    ]);
    console.log(`Model responded in ${Date.now() - start}ms:`, result.content);
  } catch (error) {
    console.error("Error during Gemini test:", error);
  }
}

testGemini();
