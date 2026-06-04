import { Activity, ClipboardList, Loader2 } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder.jsx";
import { LANGUAGE_OPTIONS } from "../utils/constants.js";

export const initialTriageForm = {
  name: "",
  age: "",
  gender: "Female",
  location: "",
  language: "English",
  medical_conditions: "",
  medications: "",
  allergies: "",
  symptoms: "",
  duration: "",
  severity: 5,
  additional_notes: ""
};

export default function SymptomForm({ error, form, loading, onChange, onSubmit }) {
  function appendTranscript(text) {
    onChange("symptoms", [form.symptoms, text].filter(Boolean).join(" "));
  }

  return (
    <section className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-clinic-green" size={22} aria-hidden="true" />
          <h2 className="text-lg font-semibold">Patient Intake</h2>
        </div>
        <VoiceRecorder onTranscript={appendTranscript} />
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Age" required>
            <input type="number" min="0" value={form.age} onChange={(e) => onChange("age", e.target.value)} />
          </Field>
          <Field label="Gender" required>
            <select value={form.gender} onChange={(e) => onChange("gender", e.target.value)}>
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </Field>
          <Field label="Location">
            <input value={form.location} onChange={(e) => onChange("location", e.target.value)} placeholder="City or region" />
          </Field>
          <Field label="Language">
            <select value={form.language} onChange={(e) => onChange("language", e.target.value)}>
              {LANGUAGE_OPTIONS.map((language) => <option key={language}>{language}</option>)}
            </select>
          </Field>
          <Field label="Symptom Severity" required>
            <div className="flex items-center gap-3">
              <input className="accent-clinic-green" type="range" min="1" max="10" value={form.severity} onChange={(e) => onChange("severity", e.target.value)} />
              <output className="grid h-10 w-10 place-items-center rounded-md border border-clinic-line font-semibold">{form.severity}</output>
            </div>
          </Field>
        </div>

        <Field label="Symptoms" required>
          <textarea rows="4" value={form.symptoms} onChange={(e) => onChange("symptoms", e.target.value)} placeholder="Example: fever, cough, chest pain" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration" required>
            <input value={form.duration} onChange={(e) => onChange("duration", e.target.value)} placeholder="Example: 3 days" />
          </Field>
          <Field label="Allergies">
            <input value={form.allergies} onChange={(e) => onChange("allergies", e.target.value)} placeholder="Comma separated" />
          </Field>
          <Field label="Existing Conditions">
            <input value={form.medical_conditions} onChange={(e) => onChange("medical_conditions", e.target.value)} placeholder="Comma separated" />
          </Field>
          <Field label="Current Medications">
            <input value={form.medications} onChange={(e) => onChange("medications", e.target.value)} placeholder="Comma separated" />
          </Field>
        </div>

        <Field label="Additional Notes">
          <textarea rows="3" value={form.additional_notes} onChange={(e) => onChange("additional_notes", e.target.value)} />
        </Field>

        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-clinic-red">{error}</p>}

        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-clinic-green px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:bg-slate-400" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={19} /> : <Activity size={19} />}
          Generate Triage Guidance
        </button>
      </form>
    </section>
  );
}

function Field({ children, label, required = false }) {
  return (
    <label className="block text-sm font-medium text-clinic-ink">
      <span className="mb-1.5 inline-block">{label}{required && <span className="text-clinic-red"> *</span>}</span>
      {children}
    </label>
  );
}
