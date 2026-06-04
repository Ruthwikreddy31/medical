import { useEffect, useState } from "react";
import { FileSearch, Languages, Stethoscope } from "lucide-react";
import { submitTriage } from "../api/triageApi.js";
import ChatWindow from "../components/ChatWindow.jsx";
import RecommendationCard from "../components/RecommendationCard.jsx";
import RiskCard from "../components/RiskCard.jsx";
import SymptomForm, { initialTriageForm } from "../components/SymptomForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { splitList, validateTriageForm } from "../utils/validators.js";

export default function Triage() {
  const { session } = useAuth();
  const [form, setForm] = useState(() => {
    try {
      const stored = localStorage.getItem("triage-form-state");
      return stored ? JSON.parse(stored) : initialTriageForm;
    } catch {
      return initialTriageForm;
    }
  });

  useEffect(() => {
    try {
      const pendingStr = localStorage.getItem("pending-triage-symptoms");
      let hasInputs = !!pendingStr;
      
      if (!hasInputs) {
        const storedForm = localStorage.getItem("triage-form-state");
        if (storedForm) {
          try {
            const parsed = JSON.parse(storedForm);
            if (parsed?.symptoms || parsed?.name || parsed?.age) {
              hasInputs = true;
            }
          } catch {}
        }
      }

      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        setForm((current) => {
          const updated = {
            ...current,
            ...pending
          };
          localStorage.setItem("triage-form-state", JSON.stringify(updated));
          return updated;
        });
        localStorage.removeItem("pending-triage-symptoms");
      }
      
      if (hasInputs) {
        const lastResult = localStorage.getItem("last-triage-result");
        if (lastResult) {
          setResult(JSON.parse(lastResult));
        }
      }
    } catch (error) {
      console.warn("Failed to load pending triage symptoms or results", error);
    }
  }, []);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => {
      const updated = { ...current, [field]: value };
      localStorage.setItem("triage-form-state", JSON.stringify(updated));
      return updated;
    });
  }

  async function submit(event) {
    event.preventDefault();
    const validationError = validateTriageForm(form);
    if (validationError) return setError(validationError);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        severity: Number(form.severity),
        medical_conditions: splitList(form.medical_conditions),
        medications: splitList(form.medications),
        allergies: splitList(form.allergies)
      };
      const data = await submitTriage(payload, session.token);
      setResult(data);
      localStorage.setItem("last-triage-result", JSON.stringify(data));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
      <SymptomForm error={error} form={form} loading={loading} onChange={updateField} onSubmit={submit} />
      <section className="space-y-4">
        <div className="rounded-lg border border-clinic-line bg-clinic-panel p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope className="text-clinic-green" size={22} />
            <h2 className="text-lg font-semibold">Triage Result</h2>
          </div>
          {!result && <div className="grid min-h-80 place-items-center rounded-md border border-dashed border-clinic-line bg-white p-6 text-center text-clinic-muted">Submit patient symptoms to view risk level, retrieved context, recommendations, and audit metadata.</div>}
          {result && <ResultPanel result={result} />}
        </div>
        <ChatWindow result={result} />
      </section>
    </div>
  );
}

function ResultPanel({ result }) {
  return (
    <div className="space-y-4">
      <RiskCard assessment={result.risk_assessment} />
      <RecommendationCard recommendations={result.recommendations} />
      <SimpleList icon={<FileSearch size={20} />} title="Possible Causes" items={result.possible_conditions} />
      <div className="rounded-md border border-clinic-line bg-white p-4">
        <h3 className="mb-2 flex items-center gap-2 font-semibold"><Languages size={20} />Doctor Visit</h3>
        <p className="text-sm text-clinic-muted">{result.doctor_visit_recommendation.required ? "Recommended" : "Not required immediately"}: {result.doctor_visit_recommendation.timeline}</p>
      </div>
      {result.localized_guidance && <div className="rounded-md border border-clinic-line bg-white p-4"><h3 className="mb-2 font-semibold">{result.localized_guidance.language} Guidance</h3><p className="text-sm text-clinic-muted">{result.localized_guidance.primary_action}</p></div>}
      <SimpleList title="Retrieved Medical Context" items={result.retrieved_medical_context.map((context) => `${context.source}: ${context.content}`)} />
      <p className="rounded-md bg-white p-3 text-xs text-clinic-muted">{result.safety_disclaimer}</p>
    </div>
  );
}

function SimpleList({ icon, title, items = [] }) {
  return (
    <div className="rounded-md border border-clinic-line bg-white p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">{icon}{title}</h3>
      <ul className="space-y-2 text-sm text-clinic-muted">{items.map((item) => <li className="rounded-md bg-clinic-panel px-3 py-2" key={item}>{item}</li>)}</ul>
    </div>
  );
}
