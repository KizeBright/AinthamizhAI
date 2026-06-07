import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function SentenceGenerator() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    noun: "மாணவன்",
    verb: "படி",
    tense: "present",
    gender: "male",
    mode: "sentence",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const generateSentence = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/generator", form);
      setResult(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Sentence generation failed.");
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
          Sentence Generator
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
          Build Tamil sentences from grammar controls.
        </h1>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <form
          onSubmit={generateSentence}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          {[
            ["noun", "Noun"],
            ["verb", "Verb"],
          ].map(([key, label]) => (
            <label key={key} className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                {label}
              </span>
              <input
                required
                value={form[key]}
                onChange={(event) => updateField(key, event.target.value)}
                className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          ))}

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Tense
            </span>
            <select
              value={form.tense}
              onChange={(event) => updateField("tense", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="past">Past</option>
              <option value="present">Present</option>
              <option value="future">Future</option>
            </select>
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Gender
            </span>
            <select
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Neutral</option>
              <option value="plural">Plural</option>
            </select>
          </label>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Mode
            </span>
            <select
              value={form.mode}
              onChange={(event) => updateField("mode", event.target.value)}
              className="w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="sentence">Sentence</option>
              <option value="dialogue">Dialogue</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {result ? (
            <div>
              <blockquote className="rounded-lg border-l-4 border-emerald-700 bg-slate-50 p-6">
                <p className="text-3xl font-black leading-[1.8] text-slate-950">
                  {result.sentence}
                </p>
                {result.dialogue?.length > 0 && (
                  <div className="mt-5 space-y-3 text-xl font-bold leading-9 text-slate-800">
                    {result.dialogue.map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    ))}
                  </div>
                )}
              </blockquote>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-emerald-50 p-4 text-emerald-800">
                  <p className="text-xs font-black uppercase tracking-wider">
                    Transliteration
                  </p>
                  <p className="mt-2 font-semibold">{result.transliteration}</p>
                </div>
                <div className="rounded-md bg-sky-50 p-4 text-sky-800">
                  <p className="text-xs font-black uppercase tracking-wider">
                    Grammar Note
                  </p>
                  <p className="mt-2 leading-7">{result.grammarNoteTamil}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-96 place-items-center rounded-md bg-slate-50 p-6 text-center text-slate-500">
              Generated Tamil output will appear here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SentenceGenerator;
