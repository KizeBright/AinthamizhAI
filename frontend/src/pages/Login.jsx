import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card, ErrorAlert, Icon, SegmentedControl, SuccessAlert } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notifications";

function Login() {
  const navigate = useNavigate();
  const { forgotPassword, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
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
        form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
          ? "Enter a valid email address."
          : "",
      password:
        mode !== "reset" && form.password && form.password.length < 6
          ? "Password must be at least 6 characters."
          : "",
    }),
    [form, mode],
  );

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
        notify.success("Password reset email sent.");
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
    loading ? "Working..." : mode === "reset" ? "Send reset link" : "Continue";

  return (
    <section className="page-shell fade-in flex min-h-[calc(100vh-98px)] items-center">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="max-w-2xl">
          <span className="badge border-indigo-100 bg-indigo-50 text-indigo-700">
            <Icon name="home" className="h-4 w-4" />
            Ainthamizh AI
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-gray-950">
            Your Tamil practice, saved and organized.
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-500">
            Sign in to track translations, pronunciation attempts, OCR scans,
            generated sentences, and learning progress from one dashboard.
          </p>
        </div>

        <Card className="p-6 sm:p-7">
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
                  onChange={(event) => updateField("displayName", event.target.value)}
                  placeholder="Your name"
                />
                {validation.displayName && (
                  <p className="mt-2 text-sm text-red-500">{validation.displayName}</p>
                )}
              </div>
            )}

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
              {validation.email && <p className="mt-2 text-sm text-red-500">{validation.email}</p>}
            </div>

            {mode !== "reset" && (
              <div>
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    className="field-control pr-12"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
                  </button>
                </div>
                {validation.password && (
                  <p className="mt-2 text-sm text-red-500">{validation.password}</p>
                )}
              </div>
            )}

            {error && (
              <ErrorAlert title="Form error" description={error} />
            )}

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
