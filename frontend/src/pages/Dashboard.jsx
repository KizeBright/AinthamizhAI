import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const emptyStats = {
  totalTranslations: 0,
  ocrScans: 0,
  pronunciationAttempts: 0,
  sentenceGenerations: 0,
  entityAnalyses: 0,
};

const formatDate = (value) => {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

function Dashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(emptyStats);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [statsResponse, activityResponse] = await Promise.all([
          API.get(`/analytics/stats/${currentUser.uid}`),
          API.get(`/analytics/activity/${currentUser.uid}`, {
            params: { limit: 12 },
          }),
        ]);

        setStats({ ...emptyStats, ...statsResponse.data.stats });
        setActivity(activityResponse.data.activity || []);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Unable to load dashboard analytics.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [currentUser]);

  const kpis = useMemo(
    () => {
      const pronunciationScores = activity
        .map((item) => item.metadata?.accuracy)
        .filter((value) => Number.isFinite(value));
      const averageAccuracy =
        pronunciationScores.length > 0
          ? Math.round(
              pronunciationScores.reduce((sum, value) => sum + value, 0) /
                pronunciationScores.length,
            )
          : 0;

      return [
        {
        label: "Translations",
        value: stats.totalTranslations,
        detail: "Tanglish converted",
        color: "border-emerald-200 bg-emerald-50 text-emerald-800",
      },
      {
        label: "OCR Scans",
        value: stats.ocrScans,
        detail: "Images processed",
        color: "border-sky-200 bg-sky-50 text-sky-800",
      },
      {
        label: "Pronunciation",
        value: stats.pronunciationAttempts,
        detail: "Speech attempts",
        color: "border-violet-200 bg-violet-50 text-violet-800",
      },
      {
        label: "Speech Accuracy",
        value: `${averageAccuracy}%`,
        detail: "Recent average",
        color: "border-teal-200 bg-teal-50 text-teal-800",
      },
      {
        label: "Sentences",
        value: stats.sentenceGenerations,
        detail: "Grammar outputs",
        color: "border-amber-200 bg-amber-50 text-amber-800",
      },
      {
        label: "Entities",
        value: stats.entityAnalyses,
        detail: "Text analyses",
        color: "border-rose-200 bg-rose-50 text-rose-800",
      },
    ];
    },
    [activity, stats],
  );

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-slate-950">
          Sign in to view your dashboard
        </h1>
        <p className="mt-3 text-slate-600">
          Your Tamil practice history and analytics are stored securely per user.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-md bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800"
        >
          Login
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Welcome back{currentUser.displayName ? `, ${currentUser.displayName}` : ""}
          </h1>
          <p className="mt-2 text-slate-600">
            A quick view of your Tamil learning activity.
          </p>
        </div>

        <Link
          to="/translator"
          className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Start translating
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((item) => (
          <article
            key={item.label}
            className={`rounded-lg border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${item.color}`}
          >
            <p className="text-sm font-bold">{item.label}</p>
            <p className="mt-4 text-4xl font-black">{loading ? "..." : item.value}</p>
            <p className="mt-2 text-sm opacity-80">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Recent Activities
            </h2>
            <p className="text-sm text-slate-500">
              Latest successful AI feature usage
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Feature", "Count Field", "Amount", "When"].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activity.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan="4">
                    No activity yet. Try a translation to get started.
                  </td>
                </tr>
              ) : (
                activity.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                        {item.label || item.feature}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.countField}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-950">
                      +{item.amount}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
