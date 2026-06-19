import { useState } from "react";
import API from "../services/api";

import {
  Button,
  Card,
  Icon,
  ToolWorkspace,
  EmptyState,
  Skeleton,
  LoginRequired,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";

function Translator() {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const translateText = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.post("/translator", { text });
      setResult(response.data.data);
    } catch (err) {
      const message = err?.response?.data?.message || "Translation failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <LoginRequired message="Translator is saved to your dashboard." />;
  }

  const inputSection = (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="card-title">Input</h2>
        <span className="text-xs font-semibold text-gray-400">{text.length}/2000</span>
      </div>
      <textarea
        className="field-control min-h-64 resize-none text-gray-900 dark:text-gray-100 text-lg leading-8"
        value={text}
        maxLength={2000}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type Tanglish or Tamil..."
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={translateText} disabled={loading || !text.trim()}>
          {loading ? "Translating..." : "Translate"}
          <Icon name="arrow" className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" onClick={() => { setText(""); setResult(null); setError(""); }}>
          <Icon name="clear" className="h-4 w-4" />
          Clear
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
      )}
    </Card>
  );

  const resultSection = (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="card-title">Output</h2>
      </div>

      {loading ? (
        <Skeleton className="min-h-64 w-full" />
      ) : result ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-900/30 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-200">Tamil</p>
            <p className="mt-2 text-3xl font-bold leading-[1.8] text-gray-950 dark:text-gray-50">
              {result?.tamilText || "—"}
            </p>
          </div>



          {result?.tokens?.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tokens</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.tokens.slice(0, 12).map((token, index) => (
                  <span
                    key={`${token.source}-${index}`}
                    className="badge border-indigo-100 bg-white text-indigo-700 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300"
                  >
                    {token.source} {"->"} {token.tamil}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon="translate"
          title="Translation output will appear here."
          description="Enter Tanglish (roman Tamil) to get clean Tamil and English meaning when available."
        />
      )}
    </Card>
  );

  return (
    <ToolWorkspace
      eyebrow="Translator"
      title="Convert Tanglish into clean Tamil script."
      description="Tamil output and English meaning (when provided by backend)."
      error={error || undefined}
      input={inputSection}
      result={resultSection}
      gridClassName="lg:grid-cols-2"
    />
  );
}

export default Translator;
