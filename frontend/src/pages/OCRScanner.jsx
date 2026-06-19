import { useMemo, useState } from "react";

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

const HISTORY_KEY = "ainthamizh:ocr-history";

const examples = [
  {
    id: "notebook",
    title: "Notebook photo",
    description: "Try a clear handwritten or printed Tamil note.",
  },
  {
    id: "worksheet",
    title: "Worksheet crop",
    description: "Use a close crop with high contrast for better extraction.",
  },
  {
    id: "screenshot",
    title: "Text screenshot",
    description: "Upload a screenshot containing Tanglish or Tamil text.",
  },
];

function OCRScanner() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory(HISTORY_KEY));
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const extractedText = result?.ocr?.extractedText || "";
  const tamilText = result?.tamil?.tamilText || "";

  const selectFile = (nextFile) => {
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      const message = "Please upload an image file.";
      setError(message);
      notify.error("Upload failure: image files only.");
      return;
    }

    setFile(nextFile);
    setResult(null);
    setError("");
    notify.success("Upload success.");
  };

  const scanImage = async () => {
    if (!file) {
      const message = "Upload an image before scanning.";
      setError(message);
      notify.error(message);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/ocr", formData);
      const data = response.data.data;
      setResult(data);
      setHistory(
        saveHistoryItem(HISTORY_KEY, {
          title: file.name,
          input: file.name,
          output: data?.ocr?.extractedText || "",
          tamilText: data?.tamil?.tamilText || "",
        }),
      );
      notify.success("OCR result saved to local history.");
    } catch (err) {
      const message = err?.response?.data?.message || "OCR scan failed.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    const text = [extractedText, tamilText].filter(Boolean).join("\n\n");

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    notify.success("OCR result copied.");
  };

  if (!currentUser) {
    return <LoginRequired message="OCR scans are saved to your dashboard." />;
  }

  const inputSection = (
    <>
      <Card>
        <h2 className="section-title">Upload Area</h2>
        <label
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}
          className={`mt-5 grid min-h-64 cursor-pointer place-items-center rounded-2xl border border-dashed p-6 text-center transition ${
            dragging
              ? "border-indigo-300 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/30"
              : "border-gray-200 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
          }`}
        >
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0])} />
          <span>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Icon name="upload" className="h-6 w-6" />
            </span>
            <span className="mt-4 block font-semibold text-gray-950 dark:text-gray-100">Drop an image here or click to browse</span>
            <span className="mt-2 block helper-text">PNG, JPG, or WebP up to backend limits.</span>
          </span>
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" disabled={!file || loading} onClick={scanImage}>
            {loading ? "Scanning..." : "Extract text"}
            <Icon name="scan" className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" onClick={() => { setFile(null); setResult(null); }}>
            <Icon name="clear" className="h-4 w-4" />
            Clear
          </Button>
        </div>
        {file && (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800/50 p-3">
            <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Image Preview</p>
            <img src={previewUrl} alt="Uploaded OCR preview" className="max-h-80 w-full rounded-xl object-contain" />
          </div>
        )}
      </Card>
      <ExamplePanel
        examples={examples}
        onSelect={(example) => notify.info(`${example.title}: ${example.description}`)}
      />
    </>
  );

  const resultSection = (
    <>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Extracted Text</h2>
            <p className="mt-1 helper-text">OCR output and Tamil conversion.</p>
          </div>
          <Button type="button" variant="secondary" onClick={copyResult} disabled={!extractedText && !tamilText} className="px-3 py-2">
            <Icon name="copy" className="h-4 w-4" />
            Copy
          </Button>
        </div>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Extracted text (input)</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tamil / Raw</p>
                  <p className="mt-2 whitespace-pre-wrap text-lg leading-8 text-gray-900 dark:text-gray-100">{extractedText}</p>
                </div>

              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-900/30 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Tamil conversion</p>
                <p className="mt-3 whitespace-pre-wrap text-2xl font-bold leading-10 text-gray-950 dark:text-gray-50">{tamilText || "No Tamil conversion returned."}</p>
              </div>

            </div>
            {result.ocr?.notes && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-amber-800 dark:text-amber-300">
                <p className="text-xs font-bold uppercase tracking-wider">Notes</p>
                <p className="mt-2 leading-7">{result.ocr.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon="scan" title="Extracted text will appear here." description="Upload an image and run OCR to view raw text, Tamil conversion, and notes." />
        )}
      </Card>
      <HistoryPanel
        items={history}
        onClear={() => { setHistory(clearHistory(HISTORY_KEY)); notify.success("OCR history cleared."); }}
        onReuse={(item) => { setResult({ ocr: { extractedText: item.output }, tamil: { tamilText: item.tamilText } }); notify.info("History entry loaded."); }}
      />
    </>
  );

  return (
    <ToolWorkspace
      eyebrow="OCR Scanner"
      title="Extract Tanglish and Tamil text from images."
      description="Upload notes, worksheets, or screenshots and convert visible language into reusable text."
      error={error}
      onRetry={file ? scanImage : undefined}
      input={inputSection}
      result={resultSection}
      gridClassName="lg:grid-cols-2"
    />
  );
}

export default OCRScanner;
