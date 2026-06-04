import { API_URL } from "../utils/constants.js";

export async function askDoctorChat(messages, context, token) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ messages, context })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to communicate with chat service");
  }

  return data;
}
