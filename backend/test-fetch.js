import dotenv from "dotenv";
dotenv.config();

async function testFetch() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  console.log("Sending fetch to:", `https://generativelanguage.googleapis.com/...:generateContent?key=${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + "..." : "missing"}`);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    
    console.log("HTTP status code:", response.status);
    const json = await response.json();
    console.log("Response JSON:", JSON.stringify(json, null, 2));
  } catch (error) {
    console.error("Fetch failed with error:", error);
  }
}

testFetch();
