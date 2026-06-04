import { useEffect, useState } from "react";
import { 
  Upload, 
  FileText, 
  User, 
  AlertTriangle, 
  Brain, 
  Target, 
  Stethoscope, 
  Lightbulb, 
  AlertOctagon, 
  TrendingUp, 
  BookOpen, 
  Download, 
  MessageSquare,
  ArrowRight,
  Heart,
  Calendar,
  Layers,
  FileCheck,
  Activity,
  Plus
} from "lucide-react";
import { uploadReport, downloadReportPdf } from "../api/reportApi.js";
import ReportUploader from "../components/ReportUploader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Reports({ onNavigate }) {
  const { session } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("last-report-analysis");
      if (stored) {
        setAnalysis(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load stored report analysis", e);
    }
  }, []);

  async function handleUpload(file) {
    setLoading(true);
    setError("");
    try {
      const data = await uploadReport(file, session.token);
      setAnalysis(data);
      localStorage.setItem("last-report-analysis", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("report-analyzed", { detail: data }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!analysis) return;
    setPdfLoading(true);
    try {
      await downloadReportPdf(analysis, session.token);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF report");
    } finally {
      setPdfLoading(false);
    }
  }

  function handleContinueTriage() {
    if (!analysis) return;
    
    // Map risk assessment level to severity (1-10)
    let severity = 5;
    const level = analysis.risk_assessment?.level?.toLowerCase();
    if (level === "emergency") severity = 10;
    else if (level === "urgent") severity = 8;
    else if (level === "moderate") severity = 5;
    else if (level === "low risk" || level === "low") severity = 3;

    // Build pending symptoms payload for localStorage
    const pendingForm = {
      name: analysis.patient_info?.name || "",
      age: analysis.patient_info?.age || "",
      gender: analysis.patient_info?.gender || "Female",
      symptoms: analysis.abnormal_findings?.map(f => `${f.parameter} (${f.value})`).join(", ") || "Abnormal lab results found",
      duration: "Recent",
      severity: severity,
      medical_conditions: analysis.possible_conditions?.join(", ") || "",
      additional_notes: `Based on medical report dated ${analysis.patient_info?.date || "N/A"}.\n\nAI Explanation: ${analysis.ai_explanation || ""}\n\nHealth Score: ${analysis.health_score || "N/A"}/100\nTrend: ${analysis.trend_analysis || ""}`
    };

    localStorage.setItem("pending-triage-symptoms", JSON.stringify(pendingForm));
    if (onNavigate) {
      onNavigate("triage");
    }
  }

  function resetAnalysis() {
    setAnalysis(null);
    setError("");
    localStorage.removeItem("last-report-analysis");
  }

  return (
    <div className="space-y-6">
      {!analysis && (
        <ReportUploader error={error} loading={loading} onUpload={handleUpload} />
      )}

      {analysis && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner & Control Actions */}
          <div className="flex flex-col gap-4 rounded-xl border border-clinic-line bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-clinic-green">
                <FileCheck size={26} />
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-clinic-green">
                  📄 Report Analysis Complete
                </span>
                <h1 className="mt-1 text-xl font-bold text-clinic-ink">
                  Diagnostic Overview
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetAnalysis}
                className="inline-flex items-center gap-2 rounded-lg border border-clinic-line bg-white px-4 py-2 text-sm font-semibold text-clinic-muted hover:bg-slate-50 transition"
              >
                Upload Another
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-clinic-line bg-white px-4 py-2 text-sm font-semibold text-clinic-ink hover:bg-slate-50 transition disabled:opacity-50"
              >
                {pdfLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-clinic-ink border-t-transparent" />
                ) : (
                  <Download size={16} />
                )}
                Doctor Summary PDF
              </button>
              <button
                onClick={handleContinueTriage}
                className="inline-flex items-center gap-2 rounded-lg bg-clinic-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
              >
                <MessageSquare size={16} />
                Continue Symptom Triage
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Emergency Alerts if any */}
          {analysis.emergency_alerts && analysis.emergency_alerts.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm text-clinic-red animate-pulse">
              <div className="flex items-start gap-3">
                <AlertOctagon size={24} className="mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-base font-bold">Emergency Medical Alert</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm font-medium">
                    {analysis.emergency_alerts.map((alert, idx) => (
                      <li key={idx}>{alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Patient Info & Health Score Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Patient Info Card */}
            <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm md:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                <User size={18} className="text-clinic-green" />
                Patient Details
              </h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="rounded-lg bg-clinic-panel p-3">
                  <span className="text-xs text-clinic-muted block mb-0.5">Name</span>
                  <span className="font-semibold text-clinic-ink block truncate">
                    {analysis.patient_info?.name || "N/A"}
                  </span>
                </div>
                <div className="rounded-lg bg-clinic-panel p-3">
                  <span className="text-xs text-clinic-muted block mb-0.5">Age</span>
                  <span className="font-semibold text-clinic-ink block">
                    {analysis.patient_info?.age || "N/A"}
                  </span>
                </div>
                <div className="rounded-lg bg-clinic-panel p-3">
                  <span className="text-xs text-clinic-muted block mb-0.5">Gender</span>
                  <span className="font-semibold text-clinic-ink block">
                    {analysis.patient_info?.gender || "N/A"}
                  </span>
                </div>
                <div className="rounded-lg bg-clinic-panel p-3">
                  <span className="text-xs text-clinic-muted block mb-0.5">Report Date</span>
                  <span className="font-semibold text-clinic-ink block truncate">
                    {analysis.patient_info?.date || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Score Card */}
            <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm flex flex-col justify-between">
              <h2 className="flex items-center justify-between text-md font-bold text-clinic-ink">
                <span className="flex items-center gap-2">
                  <Heart size={18} className="text-clinic-red" />
                  Health Score
                </span>
                <span className="text-2xl font-black text-clinic-green">
                  {analysis.health_score ?? "N/A"}<span className="text-xs font-normal text-clinic-muted">/100</span>
                </span>
              </h2>
              <div className="my-4">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-clinic-green rounded-full transition-all duration-500" 
                    style={{ width: `${analysis.health_score ?? 0}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-clinic-muted leading-relaxed">
                Score is calculated based on abnormal indicators, metabolic flags, and clinical parameters extracted from your medical document.
              </p>
            </div>
          </div>

          {/* Main Content Layout Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Left Column: Values, Findings, Explanations */}
            <div className="space-y-6">
              {/* Extracted Values Table */}
              <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm overflow-hidden">
                <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                  <Activity size={18} className="text-clinic-green" />
                  Extracted Lab Values
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-clinic-line text-clinic-muted font-medium bg-clinic-panel">
                        <th className="py-3 px-4">Parameter</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4">Reference Range</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clinic-line">
                      {analysis.extracted_values?.map((val, idx) => {
                        const statusClass = 
                          val.status?.toLowerCase() === "high" 
                            ? "bg-red-50 text-clinic-red font-semibold"
                            : val.status?.toLowerCase() === "low"
                            ? "bg-amber-50 text-clinic-amber font-semibold"
                            : "bg-emerald-50 text-clinic-green font-semibold";
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-medium text-clinic-ink">{val.parameter}</td>
                            <td className="py-3 px-4 text-clinic-ink">
                              {val.value} <span className="text-xs text-clinic-muted font-normal">{val.unit}</span>
                            </td>
                            <td className="py-3 px-4 text-clinic-muted">{val.reference_range}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs uppercase ${statusClass}`}>
                                {val.status || "Normal"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {(!analysis.extracted_values || analysis.extracted_values.length === 0) && (
                        <tr>
                          <td colSpan="4" className="py-4 text-center text-clinic-muted">No values extracted.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Abnormal Findings Card */}
              {analysis.abnormal_findings && analysis.abnormal_findings.length > 0 && (
                <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                    <AlertTriangle size={18} className="text-clinic-amber" />
                    Abnormal Findings
                  </h2>
                  <div className="space-y-3">
                    {analysis.abnormal_findings.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="font-semibold text-clinic-ink text-sm">{item.parameter}</span>
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-clinic-amber text-xs font-bold">
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-clinic-muted leading-relaxed">
                          {item.clinical_significance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Explanation Card */}
              <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                  <Brain size={18} className="text-clinic-green" />
                  AI Explanation
                </h2>
                <div className="prose max-w-none text-sm text-clinic-muted leading-relaxed">
                  <p>{analysis.ai_explanation}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Risk, Conditions, Recommendations, Trends */}
            <div className="space-y-6">
              {/* Risk Assessment Card */}
              <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                  <Target size={18} className="text-clinic-green" />
                  Risk Assessment
                </h2>
                {analysis.risk_assessment && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-clinic-line pb-3">
                      <span className="text-sm text-clinic-muted">Risk Level</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        analysis.risk_assessment.level?.toLowerCase() === "emergency"
                          ? "bg-red-100 text-clinic-red animate-pulse"
                          : analysis.risk_assessment.level?.toLowerCase() === "urgent"
                          ? "bg-orange-100 text-orange-700"
                          : analysis.risk_assessment.level?.toLowerCase() === "moderate"
                          ? "bg-amber-100 text-clinic-amber"
                          : "bg-emerald-100 text-clinic-green"
                      }`}>
                        {analysis.risk_assessment.level || "Low Risk"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-clinic-muted block">Reasoning</span>
                      <p className="text-xs text-clinic-ink leading-relaxed">
                        {analysis.risk_assessment.reasoning}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Possible Conditions Card */}
              <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                  <Stethoscope size={18} className="text-clinic-green" />
                  Possible Conditions
                </h2>
                <ul className="space-y-2">
                  {analysis.possible_conditions?.map((cond, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-clinic-ink bg-clinic-panel p-2.5 rounded-lg border border-clinic-line/40">
                      <span className="h-2 w-2 rounded-full bg-clinic-green shrink-0" />
                      <span>{cond}</span>
                    </li>
                  ))}
                  {(!analysis.possible_conditions || analysis.possible_conditions.length === 0) && (
                    <li className="text-sm text-clinic-muted italic">No specific medical conditions identified.</li>
                  )}
                </ul>
              </div>

              {/* Recommendations Card */}
              <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-clinic-ink">
                  <Lightbulb size={18} className="text-clinic-amber" />
                  Recommendations
                </h2>
                <div className="space-y-3">
                  {analysis.recommendations?.map((rec, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-sm">
                      <input 
                        type="checkbox" 
                        defaultChecked={false} 
                        className="mt-1 h-4 w-4 rounded border-clinic-line accent-clinic-green shrink-0 cursor-pointer"
                        id={`rec-${idx}`}
                      />
                      <label htmlFor={`rec-${idx}`} className="text-xs text-clinic-muted leading-relaxed cursor-pointer select-none">
                        {rec}
                      </label>
                    </div>
                  ))}
                  {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                    <p className="text-sm text-clinic-muted italic">No dietary or medical recommendations provided.</p>
                  )}
                </div>
              </div>

              {/* Trend Analysis & References */}
              <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-4">
                {analysis.trend_analysis && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-clinic-ink uppercase tracking-wider">
                      <TrendingUp size={14} className="text-clinic-green" />
                      Trend Analysis
                    </h3>
                    <p className="text-xs text-clinic-muted leading-relaxed">
                      {analysis.trend_analysis}
                    </p>
                  </div>
                )}
                {analysis.medical_references && analysis.medical_references.length > 0 && (
                  <div className="border-t border-clinic-line pt-3">
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-clinic-ink uppercase tracking-wider">
                      <BookOpen size={14} className="text-clinic-green" />
                      Medical References
                    </h3>
                    <ul className="space-y-1.5 text-xs text-clinic-muted">
                      {analysis.medical_references.map((ref, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-clinic-green font-bold shrink-0">[{idx + 1}]</span>
                          <span className="italic leading-relaxed">{ref}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
