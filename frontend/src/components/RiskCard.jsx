import { AlertTriangle } from "lucide-react";
import { RISK_STYLES } from "../utils/constants.js";

export default function RiskCard({ assessment }) {
  if (!assessment) return null;

  const urgency = assessment.urgency_level;
  return (
    <div className={`rounded-md border p-4 ${RISK_STYLES[urgency] || RISK_STYLES.Moderate}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-80">Urgency Level</p>
          <p className="text-2xl font-bold">{urgency}</p>
        </div>
        <AlertTriangle size={30} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm">{assessment.reasoning}</p>
      <p className="mt-2 text-sm font-semibold">Confidence: {assessment.confidence_score}</p>
    </div>
  );
}
