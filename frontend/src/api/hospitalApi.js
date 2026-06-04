import { API_URL } from "../utils/constants.js";

export async function findHospitals(location, token) {
  const query = new URLSearchParams({ location });
  const response = await fetch(`${API_URL}/api/hospitals/nearest?${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Hospital search failed");
  }

  return data;
}
