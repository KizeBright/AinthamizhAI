import { useState } from "react";

import {
  Button,
  Card,
  EmptyState,
  ExamplePanel,
  Icon,
  LoginRequired,
  Skeleton,
  ToolWorkspace,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { notify } from "../utils/notifications";

const typeStyles = {
  PERSON: "border-red-100 bg-red-50 text-red-700",
  LOCATION: "border-sky-100 bg-sky-50 text-sky-700",
  ORGANIZATION: "border-indigo-100 bg-indigo-50 text-indigo-700",
  DATE: "border-amber-100 bg-amber-50 text-amber-700",
  CONCEPT: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

const examples = [
  {
    id: "place",
    title: "Place and person",
    description: "ரவி சென்னை நகரில் தமிழ் கற்றுக்கொள்கிறான்.",
    text: "ரவி சென்னை நகரில் தமிழ் கற்றுக்கொள்கிறான்.",
  },
  {
    id: "date",
    title: "Date example",
    description: "ஜூன் 16 அன்று பள்ளியில் விழா நடக்கிறது.",
    text: "ஜூன் 16 அன்று பள்ளியில் விழா நடக்கிறது.",
  },
  {
    id: "concept",
    title: "Learning concept",
    description: "இலக்கணம் தமிழ் மொழியின் முக்கிய பகுதி.",
    text: "இலக்கணம் தமிழ் மொழியின் முக்கிய பகுதி.",
  },
];

function EntityAnalyzer() {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeEntities = async () => {
    if (!text.trim()) {
      const message = "Enter Tamil text to analyze.";
      setError(message);
      notify.error(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/ner", { text });
      setAnalysis(response.data.data);
      notify.success("Entity analysis complete.");
    } catch (err) {
      const message = err?.response?.data?.message || "Entity analysis failed.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <LoginRequired message="Entity analysis is saved to your dashboard." />;
  }

  const inputSection = (
    <div className="space-y-5">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Input Section</h2>
          <span className="text-xs font-semibold text-gray-400">{text.length}/6000</span>
        </div>
        <textarea
          className="field-control min-h-96 resize-none text-gray-900 dark:text-gray-100 text-lg leading-8"
          value={text}
          maxLength={6000}
          onChange={(event) => setText(event.target.value)}
          placeholder="தமிழ் உரையை இங்கே உள்ளிடுங்கள்..."
        />
        <Button type="button" disabled={loading} onClick={analyzeEntities} className="mt-4">
          {loading ? "Analyzing..." : "Analyze entities"}
          <Icon name="entity" className="h-4 w-4" />
        </Button>
      </Card>

      <ExamplePanel
        examples={examples}
        onSelect={(example) => {
          setText(example.text);
          notify.info("Example loaded.");
        }}
      />
    </div>
  );

  const resultSection = (
    <Card>
      <div className="mb-4">
        <h2 className="section-title">Analysis Results</h2>
        <p className="mt-1 helper-text">Entities are displayed as readable chips and cards.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-36 w-full" />
            ))}
          </div>
        </div>
      ) : analysis ? (
        <>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Summary</p>
            <p className="mt-2 leading-8 text-gray-900 dark:text-gray-100">{analysis.summary}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(analysis.entities || []).map((entity, index) => (
              <span
                key={`${entity.text}-chip-${index}`}
                className={`badge ${typeStyles[entity.type] || "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
              >
                {entity.text} · {entity.type}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(analysis.entities || []).map((entity, index) => (
              <article
                key={`${entity.text}-${index}`}
                className={`rounded-2xl border p-4 ${
                  typeStyles[entity.type] || "border-gray-200 bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold">{entity.text}</h3>
                  <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-bold">
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
        <EmptyState
          icon="entity"
          title="Entity explanations will appear here."
          description="Run an analysis to see color-coded entities, confidence, and Tamil explanations."
        />
      )}
    </Card>
  );

  return (
    <ToolWorkspace
      eyebrow="Entity Analyzer"
      title="Understand names, places, dates, and concepts in Tamil."
      description="Paste Tamil text to identify key entities and receive learner-friendly explanations."
      error={error}
      onRetry={text.trim() ? analyzeEntities : undefined}
      input={inputSection}
      result={resultSection}
      gridClassName="lg:grid-cols-[0.9fr_1.1fr]"
    />
  );
}

export default EntityAnalyzer;
