export default function ChatWindow({ result }) {
  return (
    <div className="rounded-md border border-clinic-line bg-white p-4">
      <h3 className="mb-3 font-semibold">Assistant Conversation</h3>
      <div className="space-y-2 text-sm">
        <p className="rounded-md bg-clinic-panel p-3 text-clinic-muted">Describe symptoms, duration, history, medications, and allergies.</p>
        {result && <p className="rounded-md bg-emerald-50 p-3 text-clinic-green">{result.risk_assessment.reasoning}</p>}
      </div>
    </div>
  );
}
