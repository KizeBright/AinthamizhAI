import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function PronunciationValidator() {
  const { currentUser } = useAuth();
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [targetText, setTargetText] = useState("நான் தமிழ் பேசுவேன்");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startRecording = async () => {
    setError("");
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err.message || "Microphone permission was denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const submitAudio = async () => {
    if (!audioBlob) {
      setError("Record audio before submitting.");
      return;
    }

    if (!targetText.trim()) {
      setError("Target Tamil text is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post("/pronunciation", audioBlob, {
        headers: {
          "Content-Type": audioBlob.type || "audio/webm",
          "X-Target-Text": targetText,
        },
        params: { targetText },
      });

      setResult(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Pronunciation validation failed.");
    } finally {
      setLoading(false);
    }
  };

  const accuracy = result?.accuracy || 0;
  const gaugeStyle = {
    background: `conic-gradient(#047857 ${accuracy * 3.6}deg, #e2e8f0 0deg)`,
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
          Pronunciation Validator
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
          Record Tamil speech and get targeted feedback.
        </h1>
      </div>

      {error && (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[440px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Target Tamil text
            </span>
            <textarea
              className="min-h-32 w-full resize-none rounded-md border border-slate-300 bg-slate-50 p-4 text-xl font-bold leading-9 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              value={targetText}
              onChange={(event) => setTargetText(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className={`rounded-md px-5 py-3 font-bold text-white transition ${
                recording
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {recording ? "Stop recording" : "Start recording"}
            </button>
            <button
              type="button"
              disabled={!audioBlob || loading}
              onClick={submitAudio}
              className="rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Validating..." : "Submit audio"}
            </button>
          </div>

          {recording && (
            <div className="mt-5 flex items-center gap-3 rounded-md bg-rose-50 p-4 text-rose-700">
              <span className="h-3 w-3 animate-pulse rounded-full bg-rose-600" />
              Recording in progress
            </div>
          )}

          {audioBlob && !recording && (
            <audio
              className="mt-5 w-full"
              controls
              src={URL.createObjectURL(audioBlob)}
            />
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {result ? (
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <div className="grid place-items-center">
                <div
                  className="grid h-56 w-56 place-items-center rounded-full p-4 transition-all duration-700"
                  style={gaugeStyle}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-white">
                    <div className="text-center">
                      <p className="text-5xl font-black text-slate-950">
                        {accuracy}%
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        Accuracy
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Transcript
                  </p>
                  <p className="mt-2 text-2xl font-black leading-10 text-slate-950">
                    {result.transcript || "No clear speech detected"}
                  </p>
                </div>

                <div className="mt-4 rounded-md bg-emerald-50 p-4 text-emerald-800">
                  <p className="text-xs font-black uppercase tracking-wider">
                    Feedback
                  </p>
                  <p className="mt-2 leading-7">{result.feedback}</p>
                </div>

                <div className="mt-4 space-y-3">
                  {(result.phonemeIssues || []).map((issue, index) => (
                    <div
                      key={`${issue.sound}-${index}`}
                      className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900"
                    >
                      <p className="font-black">{issue.sound}</p>
                      <p className="mt-1 text-sm">{issue.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-96 place-items-center rounded-md bg-slate-50 p-6 text-center text-slate-500">
              Your pronunciation score and correction tips will appear here.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PronunciationValidator;
