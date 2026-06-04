import { createContext, useContext, useState } from "react";
import { login as loginApi, register as registerApi, loginWithGoogle } from "../api/authApi.js";

const AuthContext = createContext(null);

function loadSavedSession() {
  try {
    const saved = localStorage.getItem("triage-session");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed?.token && parsed?.user?.name ? parsed : null;
  } catch {
    localStorage.removeItem("triage-session");
    return null;
  }
}

function clearUserSessionData() {
  try {
    localStorage.removeItem("triage-form-state");
    localStorage.removeItem("last-triage-result");
    localStorage.removeItem("last-report-analysis");
    localStorage.removeItem("chatbot-messages");
    localStorage.removeItem("chatbot-is-open");
    localStorage.removeItem("chatbot-has-autostarted");
    localStorage.removeItem("pending-triage-symptoms");
    localStorage.removeItem("active-tab");
  } catch (e) {
    console.warn("Failed to clear user session data", e);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSavedSession);

  async function login(payload) {
    const oldSessionStr = localStorage.getItem("triage-session");
    const nextSession = await loginApi(payload);
    
    let shouldClear = true;
    if (oldSessionStr) {
      try {
        const oldSession = JSON.parse(oldSessionStr);
        if (oldSession?.user?.email === nextSession?.user?.email) {
          shouldClear = false;
        }
      } catch (e) {
        // ignore
      }
    }
    
    if (shouldClear) {
      clearUserSessionData();
    }
    
    setSession(nextSession);
    localStorage.setItem("triage-session", JSON.stringify(nextSession));
    return nextSession;
  }

  async function register(payload) {
    const nextSession = await registerApi(payload);
    clearUserSessionData();
    setSession(nextSession);
    localStorage.setItem("triage-session", JSON.stringify(nextSession));
    return nextSession;
  }

  async function googleSignIn(credential) {
    const oldSessionStr = localStorage.getItem("triage-session");
    const nextSession = await loginWithGoogle(credential);
    
    let shouldClear = true;
    if (oldSessionStr) {
      try {
        const oldSession = JSON.parse(oldSessionStr);
        if (oldSession?.user?.email === nextSession?.user?.email) {
          shouldClear = false;
        }
      } catch (e) {
        // ignore
      }
    }
    
    if (shouldClear) {
      clearUserSessionData();
    }
    
    setSession(nextSession);
    localStorage.setItem("triage-session", JSON.stringify(nextSession));
    return nextSession;
  }

  function logout() {
    setSession(null);
    localStorage.removeItem("triage-session");
    clearUserSessionData();
  }

  return (
    <AuthContext.Provider value={{ session, login, register, logout, googleSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
