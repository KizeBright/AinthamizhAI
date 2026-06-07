import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const typeStyles = {
  PERSON: "border-rose-200 bg-rose-50 text-rose-800",
  LOCATION: "border-sky-200 bg-sky-50 text-sky-800",
  ORGANIZATION: "border-violet-200 bg-violet-50 text-violet-800",
  DATE: "border-amber-200 bg-amber-50 text-amber-800",
  CONCEPT: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function EntityAnalyzer() {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeEntities = async () => {
    if (!text.trim()) {
      setError("Enter Tamil text to analyze.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/ner", { text });
      setAnalysis(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Entity analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-950">
          Login required
        </h1>
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
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Entity Analyzer
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
          Understand names, places, dates, and concepts in Tamil.
        </h1>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <textarea
            className="min-h-96 w-full resize-none rounded-md border border-slate-300 bg-slate-50 p-4 text-lg leading-8 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            value={text}
            maxLength={6000}
            onChange={(event) => setText(event.target.value)}
            placeholder="தமிழ் உரையை இங்கே உள்ளிடுங்கள்..."
          />
          <button
            type="button"
            disabled={loading}
            onClick={analyzeEntities}
            className="mt-4 rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze entities"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {analysis ? (
            <>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm font-black uppercase tracking-wider text-slate-500">
                  Summary
                </p>
                <p className="mt-2 leading-8 text-slate-700">
                  {analysis.summary}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(analysis.entities || []).map((entity, index) => (
                  <article
                    key={`${entity.text}-${index}`}
                    className={`rounded-lg border p-4 ${
                      typeStyles[entity.type] ||
                      "border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-black">{entity.text}</h3>
                      <span className="rounded bg-white/70 px-2 py-1 text-xs font-black">
                        {entity.type}
                      </span>
                    </div>
                    <p className="mt-3 leading-7">{entity.explanationTamil}</p>
                    <p className="mt-3 text-xs font-semibold opacity-75">
                      Confidence: {Math.round((entity.confidence || 0) * 100)}%
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-96 place-items-center rounded-md bg-slate-50 p-6 text-center text-slate-500">
              AI explanations will appear as color-coded cards.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default EntityAnalyzer;
