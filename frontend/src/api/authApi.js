import { API_URL } from "../utils/constants.js";

async function request(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  return data;
}

export function login(payload) {
  return request("/api/auth/login", payload);
}

export function register(payload) {
  return request("/api/auth/register", payload);
}

export function loginWithGoogle(credential) {
  return request("/api/auth/google", { credential });
}
