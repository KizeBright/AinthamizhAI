import { useMemo, useRef, useState } from "react";

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

const examples = [
  {
    id: "basic",
    title: "Basic sentence",
    description: "நான் தமிழ் பேசுவேன்",
    text: "நான் தமிழ் பேசுவேன்",
  },
  {
    id: "greeting",
    title: "Greeting",
    description: "வணக்கம் நண்பரே",
    text: "வணக்கம் நண்பரே",
  },
  {
    id: "learning",
    title: "Learning phrase",
    description: "நான் புதிய சொற்களை கற்கிறேன்",
    text: "நான் புதிய சொற்களை கற்கிறேன்",
  },
];

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

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        notify.success("Recording saved.");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      notify.info("Recording started.");
    } catch (err) {
      const message = err.message || "Microphone permission was denied.";
      setError(message);
      notify.error(message);
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
      const message = "Record audio before submitting.";
      setError(message);
      notify.error(message);
      return;
    }

    if (!targetText.trim()) {
      const message = "Target Tamil text is required.";
      setError(message);
      notify.error(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("targetText", targetText);

      const response = await API.post("/pronunciation", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data.data);
      notify.success("Pronunciation feedback complete.");
    } catch (err) {
      const message = err?.response?.data?.message || "Pronunciation validation failed.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  };

  const accuracy = result?.accuracy || 0;
  const gaugeStyle = useMemo(
    () => ({
      background: `conic-gradient(#4F46E5 ${accuracy * 3.6}deg, #EEF2FF 0deg)`,
    }),
    [accuracy],
  );

  if (!currentUser) {
    return <LoginRequired message="Pronunciation attempts are saved to your dashboard." />;
  }

  const inputSection = (
    <>
      <Card>
        <h2 className="section-title">Recording</h2>
        <label className="mt-5 block">
          <span className="field-label">Target Tamil text</span>
          <textarea
            className="field-control min-h-32 resize-none text-xl font-semibold leading-9"
            value={targetText}
            onChange={(event) => setTargetText(event.target.value)}
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant={recording ? "secondary" : "primary"} onClick={recording ? stopRecording : startRecording}>
            <Icon name={recording ? "stop" : "mic"} className="h-4 w-4" />
            {recording ? "Stop recording" : "Start recording"}
          </Button>
          <Button type="button" disabled={!audioBlob || loading} onClick={submitAudio} variant="secondary">
            {loading ? "Validating..." : "Submit audio"}
          </Button>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
            <span>Recording readiness</span>
            <span>{audioBlob ? "Ready" : recording ? "Recording" : "Waiting"}</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-3 rounded-full transition-all ${recording ? "bg-red-500" : audioBlob ? "bg-emerald-500" : "bg-indigo-600"}`}
              style={{ width: audioBlob ? "100%" : recording ? "64%" : "18%" }}
            />
          </div>
        </div>
        {recording && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 text-red-600 dark:text-red-400">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            Recording in progress
          </div>
        )}
        {audioBlob && !recording && (
          <audio className="mt-5 w-full" controls src={URL.createObjectURL(audioBlob)} />
        )}
      </Card>
      <ExamplePanel
        examples={examples}
        onSelect={(example) => { setTargetText(example.text); notify.info("Example loaded."); }}
      />
    </>
  );

  const resultSection = (
    <Card>
      <h2 className="section-title mb-5">Results</h2>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="mx-auto h-56 w-56 rounded-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div className="grid place-items-center">
            <div className="grid h-48 w-48 place-items-center rounded-full p-4 transition-all duration-700" style={gaugeStyle}>
              <div className="grid h-full w-full place-items-center rounded-full bg-white dark:bg-gray-900 shadow-inner">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-950 dark:text-gray-50">{accuracy}%</p>
                  <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">Accuracy</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Transcript</p>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tamil</p>
                <p className="mt-2 text-2xl font-bold leading-10 text-gray-950 dark:text-gray-50">
                  {result.transcript || "No clear speech detected"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">English</p>
                <p className="mt-2 leading-7">
                  {result.transcriptEnglish || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-4 text-emerald-800 dark:text-emerald-300">
            <p className="text-xs font-bold uppercase tracking-wider">Feedback</p>
            <div className="mt-2 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-200/70">English</p>
                <p className="mt-1 leading-7">{result.feedback}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-200/70">Tamil</p>
                <p className="mt-1 leading-7">{result.feedbackTamil || "—"}</p>
              </div>
            </div>
          </div>
          {(result.phonemeIssues || []).map((issue, index) => (
            <div key={`${issue.sound}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-300">
              <p className="font-bold">{issue.sound}</p>
              <p className="mt-1 text-sm">{issue.feedback}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="mic" title="Pronunciation results will appear here." description="Record a sample and submit it to see score, transcript, and correction tips." />
      )}
    </Card>
  );

  return (
    <ToolWorkspace
      eyebrow="Pronunciation"
      title="Record Tamil speech and get targeted feedback."
      description="Practice aloud, submit your recording, and review accuracy, transcript, and sound-specific tips."
      error={error}
      onRetry={audioBlob ? submitAudio : undefined}
      input={inputSection}
      result={resultSection}
      gridClassName="lg:grid-cols-2"
    />
  );
}

export default PronunciationValidator;
