import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { validateAuthForm } from "../utils/validators.js";

export default function Login({ onModeChange }) {
  const { login, googleSignIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* global google */
  useEffect(() => {
    const initializeGoogle = () => {
      if (typeof google !== "undefined" && google.accounts?.id) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: async (response) => {
            setLoading(true);
            setError("");
            try {
              await googleSignIn(response.credential);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }
        });
        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: "100%" }
        );
        return true;
      }
      return false;
    };

    if (!initializeGoogle()) {
      const interval = setInterval(() => {
        if (initializeGoogle()) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleSignIn]);

  async function submit(event) {
    event.preventDefault();
    const validationError = validateAuthForm(form, "login");
    if (validationError) return setError(validationError);
    setLoading(true);
    setError("");
    try {
      await login(form);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Sign In">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-clinic-red">{error}</p>}
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-clinic-green px-4 py-3 font-semibold text-white disabled:bg-slate-400" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={19} /> : <Lock size={19} />}
          Login
        </button>
      </form>
      
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-clinic-line" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-clinic-muted">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-3 leading-relaxed">
            ⚠️ <strong>Google Client ID is not configured.</strong> Real Google login requires setting <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code>.<br className="mb-1" />For local testing, please click the <strong>Dev Mock Google Login</strong> button below.
          </div>
        )}
        <div id="google-signin-btn" className="w-full min-h-[44px]" />
        
        {(!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.DEV) && (
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-clinic-line bg-clinic-panel px-4 py-2.5 font-semibold text-clinic-ink hover:border-clinic-green hover:bg-white transition"
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                await googleSignIn("mock-google-token");
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
            type="button"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Dev Mock Google Login
          </button>
        )}
      </div>

      <button className="mt-4 w-full rounded-md border border-clinic-line px-4 py-2 text-sm font-semibold text-clinic-ink hover:border-clinic-green" onClick={() => onModeChange("register")} type="button">
        Create New Account
      </button>
    </AuthCard>
  );
}

export function AuthCard({ children, title }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <div className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Field({ children, label }) {
  return <label className="block text-sm font-medium text-clinic-ink"><span className="mb-1.5 inline-block">{label}</span>{children}</label>;
}
