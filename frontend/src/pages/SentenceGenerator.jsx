import { useState } from "react";

import {
  Button,
  Card,
  EmptyState,
  ExamplePanel,
  HistoryPanel,
  Icon,
  LoginRequired,
  Skeleton,
  ToolWorkspace,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { clearHistory, loadHistory, saveHistoryItem } from "../utils/history";
import { notify } from "../utils/notifications";

const HISTORY_KEY = "ainthamizh:sentence-history";

const examples = [
  {
    id: "student",
    title: "Student studies",
    description: "மாணவன் + படி",
    form: { noun: "மாணவன்", verb: "படி", tense: "present", gender: "male" },
  },
  {
    id: "she-speaks",
    title: "She will speak",
    description: "அவள் + பேசு",
    form: { noun: "அவள்", verb: "பேசு", tense: "future", gender: "female" },
  },
  {
    id: "friends-came",
    title: "Friends came",
    description: "நண்பர்கள் + வா",
    form: { noun: "நண்பர்கள்", verb: "வா", tense: "past", gender: "plural" },
  },
];

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
  const [history, setHistory] = useState(() => loadHistory(HISTORY_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const generateSentence = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/generator", form);
      const data = response.data.data;
      setResult(data);
      setHistory(
        saveHistoryItem(HISTORY_KEY, {
          title: `${form.noun} + ${form.verb}`,
          input: JSON.stringify(form),
          output: data?.sentence || data?.dialogue?.join(" ") || "",
          form,
          result: data,
        }),
      );
      notify.success("Sentence saved to local history.");
    } catch (err) {
      const message = err?.response?.data?.message || "Sentence generation failed.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    const text = [result?.sentence, ...(result?.dialogue || [])].filter(Boolean).join("\n");

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    notify.success("Sentence copied.");
  };

  if (!currentUser) {
    return <LoginRequired message="Sentence generation is saved to your learning dashboard." />;
  }

  const inputSection = (
    <div className="space-y-5">
      <Card>
        <form onSubmit={generateSentence} className="space-y-4">
          {[
            ["noun", "Noun"],
            ["verb", "Verb"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="field-label">{label}</span>
              <input
                required
                value={form[key]}
                onChange={(event) => updateField(key, event.target.value)}
                className="field-control"
              />
            </label>
          ))}

          <label className="block">
            <span className="field-label">Tense</span>
            <select
              value={form.tense}
              onChange={(event) => updateField("tense", event.target.value)}
              className="field-control"
            >
              <option value="past">Past</option>
              <option value="present">Present</option>
              <option value="future">Future</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Gender</span>
            <select
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              className="field-control"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Neutral</option>
              <option value="plural">Plural</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Mode</span>
            <select
              value={form.mode}
              onChange={(event) => updateField("mode", event.target.value)}
              className="field-control"
            >
              <option value="sentence">Sentence</option>
              <option value="dialogue">Dialogue</option>
            </select>
          </label>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate"}
            <Icon name="spark" className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      <ExamplePanel
        examples={examples}
        onSelect={(example) => {
          setForm((current) => ({ ...current, ...example.form }));
          notify.info("Example loaded.");
        }}
      />
    </div>
  );

  const resultSection = (
    <div className="space-y-5">
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Generated Output</h2>
            <p className="mt-1 helper-text">Tamil sentence, transliteration, and grammar notes.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={copyResult}
            disabled={!result}
            className="px-3 py-2"
          >
            <Icon name="copy" className="h-4 w-4" />
            Copy
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : result ? (
          <div>
            <blockquote className="rounded-2xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/30 p-6">
              <p className="text-3xl font-bold leading-[1.8] text-gray-950 dark:text-gray-50">
                {result.sentence}
              </p>
              {result.dialogue?.length > 0 && (
                <div className="mt-5 space-y-3 text-xl font-semibold leading-9 text-gray-800 dark:text-gray-200">
                  {result.dialogue.map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
              )}
            </blockquote>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-4 text-emerald-800 dark:text-emerald-300">
                <p className="text-xs font-bold uppercase tracking-wider">Transliteration</p>
                <p className="mt-2 font-semibold">{result.transliteration}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-amber-800 dark:text-amber-300">
                <p className="text-xs font-bold uppercase tracking-wider">Grammar Note</p>
                <p className="mt-2 leading-7">{result.grammarNoteTamil}</p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="sentence"
            title="Generated Tamil output will appear here."
            description="Use the controls to build a sentence or a short dialogue."
          />
        )}
      </Card>

      <HistoryPanel
        items={history}
        onClear={() => {
          setHistory(clearHistory(HISTORY_KEY));
          notify.success("Sentence history cleared.");
        }}
        onReuse={(item) => {
          if (item.form) {
            setForm(item.form);
          }
          if (item.result) {
            setResult(item.result);
          }
          notify.info("History entry loaded.");
        }}
      />
    </div>
  );

  return (
    <ToolWorkspace
      eyebrow="Sentence Generator"
      title="Build Tamil sentences from grammar controls."
      description="Choose a noun, verb, tense, gender, and output mode to generate learner-friendly Tamil."
      error={error}
      onRetry={generateSentence}
      input={inputSection}
      result={resultSection}
      gridClassName="lg:grid-cols-[420px_1fr]"
    />
  );
}

export default SentenceGenerator;
