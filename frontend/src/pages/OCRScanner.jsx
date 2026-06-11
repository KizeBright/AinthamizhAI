import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function OCRScanner() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0] || null);
    setError("");
    setResult(null);
  };

  const submitImage = async () => {
    if (!file) {
      setError("Choose an image file before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post("/ocr", formData);

      setResult(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "OCR scan failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-950">Login required</h1>
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
          OCR Scanner
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
          Scan an image and extract Tamil or Tanglish text.
        </h1>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[440px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Upload Image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <button
            type="button"
            disabled={!file || loading}
            onClick={submitImage}
            className="rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Scanning..." : "Scan image"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {result ? (
            <div className="space-y-5">
              <div className="rounded-md bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-wider text-slate-500">
                  OCR Result
                </p>
                <p className="mt-3 text-slate-700">{result.ocr?.extractedText || "No text extracted."}</p>
              </div>

              <div className="rounded-md bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-wider text-slate-500">
                  Transliteration / Tamil
                </p>
                <p className="mt-3 text-slate-700">{result.tamil?.tamilText || "No transliteration available."}</p>
              </div>
            </div>
          ) : (
            <div className="grid min-h-96 place-items-center rounded-md bg-slate-50 p-6 text-center text-slate-500">
              Uploaded image text will appear here after scanning.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default OCRScanner;
