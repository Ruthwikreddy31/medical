import { NAV_ITEMS } from "../utils/constants.js";

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="rounded-lg border border-clinic-line bg-white p-3 shadow-sm">
      <nav className="grid gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            className={`rounded-md px-3 py-2 text-left text-sm font-semibold ${
              currentPage === item.id ? "bg-clinic-green text-white" : "text-clinic-muted hover:bg-clinic-panel"
            }`}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
