import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function TanglishTranslator() {
  const { currentUser } = useAuth();
  const [text, setText] = useState("naan tamil pesuven");
  const [result, setResult] = useState(null);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const translateText = async () => {
    if (!text.trim()) {
      setError("Enter Tanglish text to translate.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/translator", { text });
      setResult(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Translation failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoTranslate || !text.trim() || !currentUser) {
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translateText();
    }, 700);

    return () => clearTimeout(debounceRef.current);
  }, [autoTranslate, text, currentUser]);

  const copyOutput = async () => {
    const tamilText = result?.tamilText || "";

    if (!tamilText) {
      return;
    }

    await navigator.clipboard.writeText(tamilText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (!currentUser) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-950">
          Login required
        </h1>
        <p className="mt-3 text-slate-600">
          The translator saves usage analytics to your dashboard.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-md bg-emerald-700 px-5 py-3 font-bold text-white"
        >
          Login
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Tanglish Translator
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Convert roman Tamil into pure Tamil script.
          </h1>
        </div>

        <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-700"
            checked={autoTranslate}
            onChange={(event) => setAutoTranslate(event.target.checked)}
          />
          Auto translate
        </label>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
              Input
            </h2>
            <span className="text-xs text-slate-400">{text.length}/2000</span>
          </div>
          <textarea
            className="min-h-80 w-full resize-none rounded-md border border-slate-300 bg-slate-50 p-4 text-lg leading-8 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            value={text}
            maxLength={2000}
            onChange={(event) => setText(event.target.value)}
            placeholder="naan tamil pesuven"
          />
          <button
            type="button"
            disabled={loading}
            onClick={translateText}
            className="mt-4 rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
              Tamil Output
            </h2>
            <button
              type="button"
              onClick={copyOutput}
              disabled={!result?.tamilText}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="min-h-80 rounded-md bg-slate-950 p-5 text-3xl font-bold leading-[1.8] text-white">
            {result?.tamilText || (
              <span className="text-base font-medium text-slate-400">
                Your Tamil text will appear here.
              </span>
            )}
          </div>

          {result?.tokens?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.tokens.slice(0, 12).map((token, index) => (
                <span
                  key={`${token.source}-${index}`}
                  className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                >
                  {token.source} {"->"} {token.tamil}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TanglishTranslator;
