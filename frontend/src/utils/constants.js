export const API_URL = import.meta.env.VITE_API_URL || "https://medical-h73k.onrender.com";

export const LANGUAGE_OPTIONS = ["English", "Hindi", "Telugu", "Tamil", "Kannada"];

export const RISK_STYLES = {
  Emergency: "border-clinic-red bg-red-50 text-clinic-red",
  Urgent: "border-clinic-amber bg-amber-50 text-clinic-amber",
  Moderate: "border-clinic-blue bg-blue-50 text-clinic-blue",
  "Low Risk": "border-clinic-green bg-emerald-50 text-clinic-green"
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "triage", label: "Triage" },
  { id: "reports", label: "Reports" }
];
