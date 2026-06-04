import { HeartPulse, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { session, logout } = useAuth();

  return (
    <header className="border-b border-clinic-line bg-clinic-panel">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-clinic-green text-white">
            <HeartPulse size={25} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">AI Healthcare Triage Assistant</h1>
            <p className="text-sm text-clinic-muted">Symptoms, reports, RAG context, safety guidance</p>
          </div>
        </div>
        {session && (
          <button
            className="inline-flex items-center gap-2 rounded-md border border-clinic-line bg-white px-3 py-2 text-sm font-semibold text-clinic-ink hover:border-clinic-green"
            onClick={logout}
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            {session.user.name}
          </button>
        )}
      </div>
    </header>
  );
}
