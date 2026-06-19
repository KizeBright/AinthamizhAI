import { useCallback, useEffect, useRef, useState } from "react";

import {
  Button,
  Card,
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

const HISTORY_KEY = "ainthamizh:translator-history";

const examples = [
  {
    id: "daily",
    title: "Daily practice",
    description: "naan tamil pesuven",
    text: "naan tamil pesuven",
  },
  {
    id: "greeting",
    title: "Greeting",
    description: "vanakkam nanbare",
    text: "vanakkam nanbare",
  },
  {
    id: "learning",
    title: "Learning sentence",
    description: "naan indru puthiya vaarthai kathukonden",
    text: "naan indru puthiya vaarthai kathukonden",
  },
];

function TanglishTranslator() {
  const { currentUser } = useAuth();
  const [text, setText] = useState("naan tamil pesuven");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory(HISTORY_KEY));
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("Tanglish");
  const [targetLanguage, setTargetLanguage] = useState("Tamil");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const translateText = useCallback(async () => {
    if (!text.trim()) {
      const message = "Enter Tanglish text to translate.";
      setError(message);
      notify.error(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/translator", { text });
      const data = response.data.data;
      setResult(data);
      setHistory(
        saveHistoryItem(HISTORY_KEY, {
          input: text,
          output: data?.tamilText || "",
          title: text,
        }),
      );
      notify.success("Translation saved to local history.");
    } catch (err) {
      const message = err?.response?.data?.message || "Translation failed.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }, [text]);

  useEffect(() => {
    if (!autoTranslate || !text.trim() || !currentUser) {
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translateText();
    }, 700);

    return () => clearTimeout(debounceRef.current);
  }, [autoTranslate, text, currentUser, translateText]);

  const copyOutput = async () => {
    const tamilText = result?.tamilText || "";

    if (!tamilText) {
      return;
    }

    await navigator.clipboard.writeText(tamilText);
    notify.success("Translation copied.");
  };

  const clearText = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  if (!currentUser) {
    return <LoginRequired message="The translator saves usage analytics to your dashboard." />;
  }

  const inputSection = (
    <>
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <label>
            <span className="field-label">Source language</span>
            <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)} className="field-control">
              <option>Tanglish</option>
              <option>Tamil</option>
            </select>
          </label>
          <Button type="button" variant="secondary" onClick={swapLanguages}>
            <Icon name="swap" className="h-4 w-4" />
            Swap
          </Button>
          <label>
            <span className="field-label">Target language</span>
            <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} className="field-control">
              <option>Tamil</option>
              <option>Tanglish</option>
            </select>
          </label>
        </div>
      </Card>

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
          placeholder="naan tamil pesuven"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" disabled={loading} onClick={translateText}>
            {loading ? "Translating..." : "Translate"}
            <Icon name="arrow" className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" onClick={clearText}>
            <Icon name="clear" className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </Card>

      <ExamplePanel
        examples={examples}
        onSelect={(example) => { setText(example.text); notify.info("Example loaded."); }}
      />
    </>
  );

  const resultSection = (
    <>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="card-title">Translation Result</h2>
          <Button type="button" variant="secondary" onClick={copyOutput} disabled={!result?.tamilText} className="px-3 py-2">
            <Icon name="copy" className="h-4 w-4" />
            Copy
          </Button>
        </div>
        {loading ? (
          <Skeleton className="min-h-64 w-full" />
        ) : (
                <div className="space-y-4">
                  <div className="min-h-64 rounded-2xl border border-gray-100 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/20 p-5 text-3xl font-bold leading-[1.8] text-gray-950 dark:text-gray-50">
                    {result?.tamilText || (
                      <span className="text-base font-medium text-gray-400">Your Tamil text will appear here.</span>
                    )}
                  </div>


                </div>
        )}
        {result?.tokens?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.tokens.slice(0, 12).map((token, index) => (
              <span key={`${token.source}-${index}`} className="badge border-indigo-100 bg-white text-indigo-700 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-300">
                {token.source} {"->"} {token.tamil}
              </span>
            ))}
          </div>
        )}
      </Card>

      <HistoryPanel
        items={history}
        onClear={() => { setHistory(clearHistory(HISTORY_KEY)); notify.success("Translator history cleared."); }}
        onReuse={(item) => { setText(item.input || ""); setResult(item.output ? { tamilText: item.output } : null); notify.info("History entry loaded."); }}
        renderItem={(item) => (
          <>
            <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.input}</span>
            <span className="mt-1 block truncate text-sm text-gray-500 dark:text-gray-400">{item.output}</span>
            <span className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Icon name="clock" className="h-3 w-3" />
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </>
        )}
      />
    </>
  );

  return (
    <ToolWorkspace
      eyebrow="Translator"
      title="Convert roman Tamil into clean Tamil script."
      description="A focused translation desk with readable input, clear output, examples, and local history."
      action={
        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600"
            checked={autoTranslate}
            onChange={(event) => setAutoTranslate(event.target.checked)}
          />
          Auto translate
        </label>
      }
      error={error}
      onRetry={text.trim() ? translateText : undefined}
      input={inputSection}
      result={resultSection}
    />
  );
}

export default TanglishTranslator;
