import { useEffect, useState } from "react";
import { 
  Activity, 
  Calendar, 
  ShieldAlert, 
  FileText, 
  ArrowRight, 
  Clipboard, 
  Heart, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { getTriageHistory } from "../api/triageApi.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard({ onNavigate }) {
  const { session } = useAuth();
  const [history, setHistory] = useState([]);
  const [lastReport, setLastReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    // 1. Fetch Triage History
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await getTriageHistory(session.token);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch triage history", err);
        setError("Could not load your health history. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (session?.token) {
      fetchHistory();
    }

    // 2. Load Last Analyzed Report
    try {
      const storedReport = localStorage.getItem("last-report-analysis");
      if (storedReport) {
        setLastReport(JSON.parse(storedReport));
      }
    } catch (e) {
      console.warn("Failed to load last report from localStorage", e);
    }
  }, [session]);

  const toggleExpand = (id) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  // Compute Stats
  const totalTriages = history.length;
  const reportsCount = lastReport ? 1 : 0;
  
  // Latest Risk Status
  let latestRisk = "Low Risk";
  if (history.length > 0) {
    latestRisk = history[0].risk_level || "Low Risk";
  } else if (lastReport) {
    latestRisk = lastReport.risk_assessment?.level || "Low Risk";
  }

  // Health Score from latest report or default
  const healthScore = lastReport ? lastReport.health_score : 100;

  // Urgency badge styling helper
  const getRiskBadgeClass = (risk) => {
    const r = risk?.toLowerCase() || "";
    if (r.includes("emergency")) return "bg-red-100 text-clinic-red border-red-200";
    if (r.includes("urgent")) return "bg-orange-100 text-orange-700 border-orange-200";
    if (r.includes("moderate")) return "bg-amber-100 text-clinic-amber border-amber-200";
    return "bg-emerald-100 text-clinic-green border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-clinic-line bg-gradient-to-r from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-clinic-green text-white shadow-sm">
            <Heart size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-clinic-ink">
              Welcome back, {session?.user?.name || "Healthcare User"}!
            </h1>
            <p className="mt-1 text-xs text-clinic-muted">
              Here is your personal health care overview. Monitor your recent triages, uploaded reports, and active recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Health Score */}
        <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinic-muted uppercase">Health Score</span>
            <Activity size={18} className="text-clinic-green" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-clinic-ink">{healthScore}</span>
            <span className="text-xs text-clinic-muted">/100</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full ${healthScore >= 80 ? "bg-clinic-green" : healthScore >= 60 ? "bg-clinic-amber" : "bg-clinic-red"}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Stat 2: Active Risk Level */}
        <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinic-muted uppercase">Latest Risk Status</span>
            <ShieldAlert size={18} className="text-clinic-amber" />
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold uppercase border ${getRiskBadgeClass(latestRisk)}`}>
              {latestRisk}
            </span>
          </div>
          <p className="text-[10px] text-clinic-muted mt-2">Based on your last screening details</p>
        </div>

        {/* Stat 3: Total Triages */}
        <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinic-muted uppercase">Triage Screenings</span>
            <Clipboard size={18} className="text-clinic-muted" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-clinic-ink">{totalTriages}</span>
            <span className="text-xs text-clinic-muted">completed</span>
          </div>
          <p className="text-[10px] text-clinic-muted mt-2">Symptom evaluation history count</p>
        </div>

        {/* Stat 4: Reports Uploaded */}
        <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinic-muted uppercase">Reports Uploaded</span>
            <FileText size={18} className="text-clinic-muted" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-clinic-ink">{reportsCount}</span>
            <span className="text-xs text-clinic-muted">active report</span>
          </div>
          <p className="text-[10px] text-clinic-muted mt-2">OCR blood reports processed</p>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-clinic-ink uppercase tracking-wider">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => onNavigate("triage")}
            className="flex items-center justify-between rounded-xl border border-clinic-line bg-slate-50/50 p-4 hover:border-clinic-green hover:bg-emerald-50/30 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-clinic-green border border-emerald-100">
                <PlusCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-clinic-ink">New Triage Session</h4>
                <p className="text-[11px] text-clinic-muted">Evaluate active physical symptoms</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-clinic-muted group-hover:text-clinic-green group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => onNavigate("reports")}
            className="flex items-center justify-between rounded-xl border border-clinic-line bg-slate-50/50 p-4 hover:border-clinic-green hover:bg-emerald-50/30 transition text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-clinic-green border border-emerald-100">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-clinic-ink">Upload Lab Report</h4>
                <p className="text-[11px] text-clinic-muted">Extract parameters & run consultation</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-clinic-muted group-hover:text-clinic-green group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Column 1: Triage Audit Log History */}
        <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-clinic-line/50 pb-2">
            <h3 className="text-base font-bold text-clinic-ink">Triage History</h3>
            <Clipboard size={18} className="text-clinic-muted" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <RefreshCw size={24} className="text-clinic-green animate-spin" />
              <span className="text-xs text-clinic-muted">Fetching triage logs...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-clinic-red">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-clinic-muted border border-slate-200">
                <Clipboard size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-clinic-ink">No Triage Records Yet</h4>
                <p className="text-[11px] text-clinic-muted max-w-[280px] mx-auto mt-1">
                  Start your first diagnostic triage session to populate your health overview timeline.
                </p>
              </div>
              <button
                onClick={() => onNavigate("triage")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-clinic-green px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition cursor-pointer"
              >
                Start Triage
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {history.map((log) => {
                const isExpanded = expandedSession === log.id;
                return (
                  <div 
                    key={log.id} 
                    className="rounded-xl border border-clinic-line bg-clinic-panel/30 overflow-hidden transition-all duration-200"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1.5 max-w-[80%]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 border ${getRiskBadgeClass(log.risk_level)}`}>
                            {log.risk_level}
                          </span>
                          <span className="text-[10px] text-clinic-muted flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(log.timestamp).toLocaleDateString(undefined, { 
                              month: "short", 
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-clinic-ink truncate leading-tight">
                          {log.user_input?.symptoms || "Intake Assessment"}
                        </h4>
                      </div>
                      <div className="text-clinic-muted">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="border-t border-clinic-line/50 bg-white p-3.5 text-xs space-y-3 animate-slideDown">
                        <div className="grid grid-cols-2 gap-2 border-b border-clinic-line/30 pb-2 text-[11px] text-clinic-muted">
                          <div>
                            <span className="font-bold text-clinic-ink block">Patient:</span>
                            <span>{log.user_input?.name || "Healthcare User"} ({log.user_input?.age}y, {log.user_input?.gender})</span>
                          </div>
                          <div>
                            <span className="font-bold text-clinic-ink block">Severity & Duration:</span>
                            <span>Scale {log.user_input?.severity}/10 · {log.user_input?.duration}</span>
                          </div>
                        </div>

                        {log.user_input?.medical_conditions?.length > 0 && (
                          <div>
                            <span className="font-bold text-clinic-ink block text-[11px] mb-0.5">Medical History:</span>
                            <span className="text-[11px] text-clinic-muted">{log.user_input.medical_conditions.join(", ")}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className="font-bold text-clinic-ink block text-[11px]">AI Clinical Recommendations:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-clinic-muted text-[11px]">
                            {log.recommendations?.map((rec, idx) => (
                              <li key={idx} className="leading-relaxed">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Last Analyzed Report Summary */}
        <div className="rounded-xl border border-clinic-line bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-clinic-line/50 pb-2">
            <h3 className="text-base font-bold text-clinic-ink">Latest Report Analysis</h3>
            <FileText size={18} className="text-clinic-muted" />
          </div>

          {lastReport ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              {/* Overview Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-clinic-green border border-emerald-100">
                    <FileCheck size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-clinic-green uppercase">Analysis Complete</span>
                    <h4 className="text-xs font-bold text-clinic-ink leading-none mt-0.5">
                      Report Date: {lastReport.patient_info?.date || "N/A"}
                    </h4>
                  </div>
                </div>

                {/* Patient Profile */}
                <div className="rounded-lg bg-clinic-panel p-3 text-[11px] grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-clinic-muted block uppercase text-[9px] font-bold">Patient</span>
                    <span className="font-semibold text-clinic-ink">{lastReport.patient_info?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-clinic-muted block uppercase text-[9px] font-bold">Age</span>
                    <span className="font-semibold text-clinic-ink">{lastReport.patient_info?.age || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-clinic-muted block uppercase text-[9px] font-bold">Gender</span>
                    <span className="font-semibold text-clinic-ink">{lastReport.patient_info?.gender || "N/A"}</span>
                  </div>
                </div>

                {/* Key Abnormal Parameters Table */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-clinic-muted font-bold uppercase block">Abnormal Parameter Indicators</span>
                  <div className="rounded-lg border border-clinic-line overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-clinic-line text-[10px] text-clinic-muted">
                          <th className="p-2 font-bold">Lab Parameter</th>
                          <th className="p-2 font-bold text-right">Value</th>
                          <th className="p-2 font-bold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastReport.extracted_values?.filter(v => v.status !== "normal").map((item, idx) => (
                          <tr key={idx} className="border-b border-clinic-line/50 last:border-none">
                            <td className="p-2 font-semibold text-clinic-ink">{item.parameter}</td>
                            <td className="p-2 text-right text-clinic-muted">{item.value} {item.unit}</td>
                            <td className="p-2 text-right">
                              <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                item.status === "high" ? "bg-red-50 text-clinic-red" : "bg-amber-50 text-clinic-amber"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Alert findings summary */}
                <div className="space-y-1 bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-xs">
                  <span className="font-bold text-clinic-amber flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    Potential Area Requiring Attention
                  </span>
                  <p className="text-[11px] text-clinic-muted leading-relaxed">
                    {lastReport.ai_explanation || "Please consult your doctor to review lab results."}
                  </p>
                </div>
              </div>

              {/* View Full Report Button */}
              <button
                onClick={() => onNavigate("reports")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-clinic-green px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition cursor-pointer"
              >
                View Full Diagnostics Report
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 flex-1 flex flex-col justify-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-clinic-muted border border-slate-200">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-clinic-ink">No Lab Reports Uploaded</h4>
                <p className="text-[11px] text-clinic-muted max-w-[280px] mx-auto mt-1">
                  Upload a CBC or general blood report PDF/image to automatically extract findings.
                </p>
              </div>
              <div>
                <button
                  onClick={() => onNavigate("reports")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-clinic-green px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition cursor-pointer"
                >
                  Upload Report
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
