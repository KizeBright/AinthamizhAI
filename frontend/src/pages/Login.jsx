import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Button,
  Card,
  ErrorAlert,
  Icon,
  SegmentedControl,
  SuccessAlert,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import { notify } from "../utils/notifications";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { forgotPassword, login, register, updatePassword } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validation = useMemo(
    () => ({
      displayName:
        mode === "register" && form.displayName.trim().length < 2
          ? "Enter at least 2 characters."
          : "",
      email:
        mode !== "recovery" &&
        form.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
          ? "Enter a valid email address."
          : "",
      password:
        mode !== "reset" && form.password && form.password.length < 6
          ? "Password must be at least 6 characters."
          : "",
      confirmPassword:
        mode === "recovery" &&
        form.confirmPassword &&
        form.password !== form.confirmPassword
          ? "Passwords do not match."
          : "",
    }),
    [form, mode],
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const queryMode = searchParams.get("mode");
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const authType = hashParams.get("type") || searchParams.get("type");

    if (queryMode === "recovery" || authType === "recovery") {
      setMode("recovery");
      setStatus("Enter a new password to finish resetting your account.");
      window.history.replaceState(null, "", "/login?mode=recovery");
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (mode === "reset") {
        await forgotPassword(form.email);
        const message =
          "Password reset email sent. Open the link to set a new password.";
        setStatus(message);
        notify.success(message);
        return;
      }

      if (mode === "recovery") {
        if (form.password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await updatePassword(form.password);
        await supabase.auth.signOut();
        const message = "Password updated. Please login with your new password.";
        setStatus(message);
        notify.success(message);
        setMode("login");
        setForm((current) => ({
          ...current,
          password: "",
          confirmPassword: "",
        }));
        window.history.replaceState(null, "", "/login");
        return;
      }

      if (mode === "register") {
        await register(form);
        notify.success("Account created successfully.");
      } else {
        await login(form.email, form.password);
        notify.success("Signed in successfully.");
      }

      navigate("/dashboard");
    } catch (err) {
      const message = err.message || "Authentication failed.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    loading
      ? "Working..."
      : mode === "reset"
        ? "Send reset link"
        : mode === "recovery"
          ? "Update password"
          : "Continue";

  return (
    <section className="page-shell fade-in flex min-h-[calc(100vh-98px)] items-center">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="max-w-2xl">
          <span className="badge border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
            <Icon name="home" className="h-4 w-4" />
            Ainthamizh AI
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-gray-950 dark:text-gray-50">
            Your Tamil practice, saved and organized.
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-500 dark:text-gray-400">
            Sign in to track translations, pronunciation attempts, OCR scans,
            generated sentences, and learning progress from one dashboard.
          </p>
        </div>

        <Card className="p-6 sm:p-7">
          {mode !== "recovery" ? (
            <SegmentedControl
              className="mb-6"
              options={["login", "register", "reset"]}
              value={mode}
              onChange={(item) => {
                setMode(item);
                setError("");
                setStatus("");
              }}
            />
          ) : (
            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              Password reset verified. Set your new password below.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="field-label" htmlFor="displayName">
                  Name
                </label>
                <input
                  id="displayName"
                  className="field-control"
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                  placeholder="Your name"
                />
                {validation.displayName && (
                  <p className="mt-2 text-sm text-red-500">
                    {validation.displayName}
                  </p>
                )}
              </div>
            )}

            {mode !== "recovery" && (
              <div>
                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  className="field-control"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                />
                {validation.email && (
                  <p className="mt-2 text-sm text-red-500">
                    {validation.email}
                  </p>
                )}
              </div>
            )}

            {mode !== "reset" && (
              <div>
                <label className="field-label" htmlFor="password">
                  {mode === "recovery" ? "New Password" : "Password"}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    className="field-control pr-12"
                    value={form.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  >
                    <Icon
                      name={showPassword ? "eyeOff" : "eye"}
                      className="h-4 w-4"
                    />
                  </button>
                </div>
                {validation.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {validation.password}
                  </p>
                )}
              </div>
            )}

            {mode === "recovery" && (
              <div>
                <label className="field-label" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  className="field-control"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  placeholder="Re-enter new password"
                />
                {validation.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    {validation.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {error && <ErrorAlert title="Form error" description={error} />}

            {status && (
              <SuccessAlert title="Form success" description={status} />
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {submitLabel}
              <Icon name="arrow" className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}

export default Login;
