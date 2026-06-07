import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { forgotPassword, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (mode === "reset") {
        await forgotPassword(form.email);
        setStatus("Password reset email sent.");
        return;
      }

      if (mode === "register") {
        await register(form);
      } else {
        await login(form.email, form.password);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-84px)] max-w-7xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Ainthamizh AI
          </p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Practice Tamil with a focused AI learning desk.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Sign in to save translations, track pronunciation attempts, and keep
            your recent language practice in one dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex rounded-md bg-slate-100 p-1">
            {["login", "register", "reset"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`flex-1 rounded px-3 py-2 text-sm font-semibold capitalize transition ${
                  mode === item
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Name
              </span>
              <input
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                value={form.displayName}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
                placeholder="Your name"
              />
            </label>
          )}

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </span>
            <input
              required
              type="email"
              className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          {mode !== "reset" && (
            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>
              <input
                required
                type="password"
                minLength={6}
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="At least 6 characters"
              />
            </label>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {status && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Working..." : mode === "reset" ? "Send reset" : "Continue"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
