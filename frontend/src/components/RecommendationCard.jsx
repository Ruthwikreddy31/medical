import { ShieldCheck } from "lucide-react";

export default function RecommendationCard({ recommendations = [] }) {
  return (
    <div className="rounded-md border border-clinic-line bg-white p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <ShieldCheck size={20} />
        Recommendations
      </h3>
      <ul className="space-y-2 text-sm text-clinic-muted">
        {recommendations.map((item) => (
          <li className="rounded-md bg-clinic-panel px-3 py-2" key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
