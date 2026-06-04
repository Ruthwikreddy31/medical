import { API_URL } from "../utils/constants.js";

export async function uploadReport(file, token) {
  const body = new FormData();
  body.append("report", file);

  const response = await fetch(`${API_URL}/api/reports/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Report upload failed");
  }

  return data;
}

export async function downloadReportPdf(analysisData, token) {
  const response = await fetch(`${API_URL}/api/reports/download-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(analysisData)
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "PDF download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "doctor-summary.pdf");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
