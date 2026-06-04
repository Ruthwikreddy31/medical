import { API_URL } from "../utils/constants.js";

export async function submitTriage(payload, token) {
  const response = await fetch(`${API_URL}/api/triage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "The triage service is not available right now.");
  }

  return data;
}

export async function getTriageHistory(token) {
  const response = await fetch(`${API_URL}/api/triage/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch triage history.");
  }

  return data;
}
