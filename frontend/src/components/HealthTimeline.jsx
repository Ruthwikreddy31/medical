export default function HealthTimeline({ sessions = [] }) {
  return (
    <div className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Health Timeline</h2>
      <div className="space-y-3">
        {sessions.length === 0 && <p className="text-sm text-clinic-muted">No previous consultations recorded yet.</p>}
        {sessions.map((session) => (
          <div className="rounded-md bg-clinic-panel p-3 text-sm" key={session.id}>
            <p className="font-semibold">{session.riskLevel}</p>
            <p className="text-clinic-muted">{session.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
