import { useState, useEffect, useRef } from "react";
import { Send, RefreshCw, Stethoscope, User, Sparkles, AlertCircle, ArrowRight, Bot, X, Heart } from "lucide-react";
import { askDoctorChat } from "../api/chatApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hello! I am your MedGuardian AI Doctor Assistant.\n\nI can help assess your symptoms and guide you through an initial triage consultation. If you upload a medical report on the **Reports** page, I will automatically analyze it and begin a focused follow-up consultation.\n\nHow can I help you today?",
  options: ["I have chest pain", "I have a fever", "I have a headache"],
  status: "ongoing",
  current_understanding: null,
  current_risk_level: "Low",
  reason: "Initial greeting and symptom screening.",
  assessment: null
};

export default function DoctorChatbot() {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem("chatbot-is-open") === "true";
  });
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem("chatbot-messages");
      return stored ? JSON.parse(stored) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const [hasAutoStarted, setHasAutoStarted] = useState(() => {
    return localStorage.getItem("chatbot-has-autostarted") === "true";
  });

  // Persist states in localStorage
  useEffect(() => {
    localStorage.setItem("chatbot-is-open", isOpen);
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem("chatbot-messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatbot-has-autostarted", hasAutoStarted);
  }, [hasAutoStarted]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  async function startReportConsultation(data) {
    setLoading(true);
    setError("");
    try {
      const response = await askDoctorChat([], { report: data }, session?.token);
      setMessages([
        {
          role: "assistant",
          content: response.ai_message,
          options: response.options,
          status: response.status,
          current_understanding: response.current_understanding,
          current_risk_level: response.current_risk_level,
          reason: response.reason,
          assessment: response.assessment
        }
      ]);
    } catch (err) {
      setError(err.message || "Failed to initiate consultation");
    } finally {
      setLoading(false);
    }
  }

  // Auto-start report chat if a report is already stored in localStorage when the chat opens
  useEffect(() => {
    if (isOpen && !hasAutoStarted && messages.length === 1 && messages[0]?.content === INITIAL_MESSAGE.content) {
      const storedReport = localStorage.getItem("last-report-analysis");
      if (storedReport) {
        setHasAutoStarted(true);
        try {
          const data = JSON.parse(storedReport);
          startReportConsultation(data);
        } catch (e) {
          console.warn("Failed to parse stored report", e);
        }
      }
    }
  }, [isOpen, hasAutoStarted, messages, session]);

  // Listen for medical report analysis to automatically begin doctor consultation
  useEffect(() => {
    async function handleReportAnalyzed(event) {
      const data = event.detail;
      setIsOpen(true);
      setHasAutoStarted(true);
      await startReportConsultation(data);
    }

    window.addEventListener("report-analyzed", handleReportAnalyzed);
    return () => window.removeEventListener("report-analyzed", handleReportAnalyzed);
  }, [session]);

  async function handleSendMessage(event, textToSend = null) {
    event?.preventDefault();
    const messageContent = textToSend || input;
    if (!messageContent.trim() || loading) return;

    setInput("");
    setError("");

    const updatedMessages = [...messages, { role: "user", content: messageContent }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      let context = {};
      const lastTriage = localStorage.getItem("last-triage-result");
      if (lastTriage) context.triage = JSON.parse(lastTriage);
      
      const lastReport = localStorage.getItem("last-report-analysis");
      if (lastReport) context.report = JSON.parse(lastReport);

      const response = await askDoctorChat(updatedMessages, context, session.token);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.ai_message,
          options: response.options,
          status: response.status,
          current_understanding: response.current_understanding,
          current_risk_level: response.current_risk_level,
          reason: response.reason,
          assessment: response.assessment
        }
      ]);
    } catch (err) {
      setError(err.message || "Failed to get response");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I am having trouble connecting to my medical database. Let's try again in a moment.",
          options: ["Retry last question"],
          status: "ongoing",
          current_understanding: null,
          current_risk_level: "Low",
          reason: "Network timeout occurred.",
          assessment: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleOptionClick(optText) {
    if (optText === "Retry last question") {
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        handleSendMessage(null, lastUserMessage.content);
      }
      return;
    }
    handleSendMessage(null, optText);
  }

  function handleReset() {
    setMessages([INITIAL_MESSAGE]);
    setHasAutoStarted(true);
    setInput("");
    setError("");
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle doctor chat assistant"
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-clinic-green text-white shadow-lg hover:bg-emerald-800 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        id="chatbot-toggle-button"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border border-clinic-line bg-white shadow-2xl overflow-hidden z-50 flex flex-col animate-slideUp"
          id="chatbot-window"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-clinic-line bg-clinic-panel px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-clinic-green border border-emerald-100">
                <Stethoscope size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-clinic-ink flex items-center gap-1.5">
                  MedGuardian Triage Assistant
                  <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-clinic-green">
                    <Sparkles size={8} className="mr-0.5" /> Safety Triage
                  </span>
                </h3>
                <p className="text-[10px] text-clinic-muted">Adaptive health questioning and risk logs</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="rounded-lg border border-clinic-line bg-white p-1.5 text-clinic-muted hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg border border-clinic-line bg-white p-1.5 text-clinic-muted hover:bg-slate-50 transition cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="h-[380px] overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/30">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={index} className="space-y-2">
                  <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-clinic-green border border-emerald-100 self-end">
                        <Stethoscope size={13} />
                      </div>
                    )}

                    <div className="max-w-[85%]">
                      <div
                        className={`rounded-xl p-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                          isUser
                            ? "bg-clinic-green text-white rounded-br-none"
                            : "bg-white text-clinic-ink border border-clinic-line/80 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {isUser && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-clinic-muted border border-slate-200 self-end">
                        <User size={13} />
                      </div>
                    )}
                  </div>

                  {/* Diagnostic response format (Current Understanding, Risk, Reason) */}
                  {!isUser && msg.current_understanding && (
                    <div className="pl-9 animate-fadeIn space-y-2">
                      <div className="rounded-lg border border-clinic-line bg-white p-3 text-[11px] shadow-sm space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-clinic-muted border-b border-clinic-line/50 pb-2">
                          <div>
                            <span className="font-bold block text-clinic-ink">Symptom:</span>
                            <span className="truncate block">{msg.current_understanding.symptom || "N/A"}</span>
                          </div>
                          <div>
                            <span className="font-bold block text-clinic-ink">Duration:</span>
                            <span className="truncate block">{msg.current_understanding.duration || "N/A"}</span>
                          </div>
                          <div>
                            <span className="font-bold block text-clinic-ink">Severity:</span>
                            <span className="truncate block">{msg.current_understanding.severity || "N/A"}</span>
                          </div>
                          <div>
                            <span className="font-bold block text-clinic-ink">Important Findings:</span>
                            <span className="truncate block" title={msg.current_understanding.important_findings}>
                              {msg.current_understanding.important_findings || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-clinic-ink text-[10px]">Risk Level:</span>
                          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            msg.current_risk_level === "Emergency"
                              ? "bg-red-100 text-clinic-red"
                              : msg.current_risk_level === "Urgent"
                              ? "bg-orange-100 text-orange-700"
                              : msg.current_risk_level === "Moderate"
                              ? "bg-amber-100 text-clinic-amber"
                              : "bg-emerald-100 text-clinic-green"
                          }`}>
                            {msg.current_risk_level || "Low"}
                          </span>
                        </div>

                        {msg.reason && (
                          <p className="text-[10px] text-clinic-muted italic border-t border-clinic-line/50 pt-2 leading-relaxed">
                            <span className="font-bold not-italic text-clinic-ink block mb-0.5">Reason for next question:</span>
                            "{msg.reason}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rendering multiple choice options for user click */}
                  {index === messages.length - 1 && !isUser && msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-9">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(opt)}
                          className="rounded-full border border-clinic-green bg-white px-3 py-1 text-[11px] font-semibold text-clinic-green hover:bg-emerald-50 transition cursor-pointer shadow-sm active:scale-95 animate-fadeIn"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Rendering final assessment summary block */}
                  {!isUser && msg.assessment && (
                    <div className="pl-9 animate-fadeIn space-y-2.5">
                      <div className="rounded-xl border border-clinic-line bg-white p-3.5 shadow-sm space-y-3">
                        <h4 className="text-[11px] font-bold text-clinic-ink uppercase tracking-wider border-b border-clinic-line pb-1.5">
                          Assessment Summary
                        </h4>
                        
                        <div className="space-y-1 text-xs text-clinic-ink">
                          <p><strong>Symptoms:</strong> {msg.assessment.symptoms}</p>
                          <p><strong>Duration:</strong> {msg.assessment.duration}</p>
                          <p><strong>Severity:</strong> {msg.assessment.severity}</p>
                          <p><strong>Key Findings:</strong> {msg.assessment.key_findings}</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9px] text-clinic-muted uppercase font-bold block">Risk Level:</span>
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase ${
                            msg.current_risk_level === "Emergency"
                              ? "bg-red-100 text-clinic-red animate-pulse"
                              : msg.current_risk_level === "Urgent"
                              ? "bg-orange-100 text-orange-700"
                              : msg.current_risk_level === "Moderate"
                              ? "bg-amber-100 text-clinic-amber"
                              : "bg-emerald-100 text-clinic-green"
                          }`}>
                            {msg.current_risk_level}
                          </span>
                        </div>

                        {msg.assessment.possible_concerns && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-clinic-muted uppercase font-bold block">Possible Concerns:</span>
                            <p className="text-xs text-clinic-ink font-medium leading-relaxed">
                              {msg.assessment.possible_concerns}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1 border-t border-clinic-line pt-2">
                          <span className="text-[9px] text-clinic-muted uppercase font-bold block">Recommendations:</span>
                          <ul className="list-disc list-inside text-xs text-clinic-ink space-y-0.5">
                            {msg.assessment.recommendations?.map((rec, idx) => (
                              <li key={idx} className="leading-relaxed">{rec}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded bg-slate-50 border border-slate-200 p-2.5 text-[10px] text-clinic-muted leading-relaxed">
                          <span className="font-bold text-clinic-ink block mb-0.5">Medical Disclaimer:</span>
                          "This AI assessment is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Seek immediate medical attention for emergencies."
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-clinic-green border border-emerald-100 self-end animate-pulse">
                  <Stethoscope size={13} />
                </div>
                <div className="rounded-xl bg-white border border-clinic-line/80 p-2.5 shadow-sm rounded-bl-none">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-clinic-green animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-clinic-green animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-clinic-green animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 border-t border-red-100 bg-red-50 px-4 py-2 text-[10px] text-clinic-red">
              <AlertCircle size={12} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Panel */}
          <form onSubmit={handleSendMessage} className="flex gap-1.5 border-t border-clinic-line p-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message or click options above..."
              disabled={loading}
              className="flex-1 min-h-10 rounded-lg border border-clinic-line bg-white px-3 text-xs text-clinic-ink focus:border-clinic-green focus:ring-1 focus:ring-clinic-green outline-none disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-clinic-green text-white shadow-sm hover:bg-emerald-800 transition disabled:bg-slate-300 cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
