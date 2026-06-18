import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Button,
  Card,
  ErrorAlert,
  Icon,
  LoginRequired,
  PageHeader,
  StatCard,
  ToolSkeleton,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { notify } from "../utils/notifications";

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

const getDisplayName = (user) =>
  user?.user_metadata?.displayName ||
  user?.user_metadata?.full_name ||
  user?.email?.split("@")[0] ||
  "";

const getActivityDetail = (item) => {
  const metadata = item.metadata || {};

  if (item.feature === "pronunciation" && Number.isFinite(metadata.accuracy)) {
    return `${metadata.accuracy}% accuracy`;
  }

  if (item.feature === "translation") {
    return `${metadata.inputLength || 0} chars translated`;
  }

  if (item.feature === "ocr") {
    return `${metadata.extractedLength || 0} chars extracted`;
  }

  if (item.feature === "entity") {
    return `${metadata.entityCount || 0} entities found`;
  }

  if (item.feature === "sentence") {
    return `${metadata.tense || "grammar"} / ${metadata.gender || "learner"}`;
  }

  return item.countField || "Feature used";
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
          API.get("/analytics/stats"),
          API.get("/analytics/activity", {
            params: { limit: 12 },
          }),
        ]);

        setStats({ ...emptyStats, ...statsResponse.data.stats });
        setActivity(activityResponse.data.activity || []);
      } catch (err) {
        const message =
          err?.response?.data?.message || "Unable to load dashboard analytics.";
        setError(message);
        notify.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [currentUser]);

  const { kpis, averageAccuracy, totalActions } = useMemo(() => {
    const pronunciationScores = activity
      .map((item) => item.metadata?.accuracy)
      .filter((value) => Number.isFinite(value));
    const average =
      pronunciationScores.length > 0
        ? Math.round(
            pronunciationScores.reduce((sum, value) => sum + value, 0) /
              pronunciationScores.length,
          )
        : 0;

    const cards = [
      ["Translations", stats.totalTranslations, "translate", "Tanglish converted"],
      ["OCR Scans", stats.ocrScans, "scan", "Images processed"],
      ["Pronunciation Attempts", stats.pronunciationAttempts, "mic", "Speech checks"],
      ["Sentences Generated", stats.sentenceGenerations, "sentence", "Grammar outputs"],
      ["Entity Analyses", stats.entityAnalyses, "progress", "Text analyses"],
    ];

    return {
      averageAccuracy: average,
      totalActions:
        stats.totalTranslations +
        stats.pronunciationAttempts +
        stats.ocrScans +
        stats.sentenceGenerations +
        stats.entityAnalyses,
      kpis: cards.map(([label, value, icon, detail]) => ({
        label,
        value,
        icon,
        detail,
      })),
    };
  }, [activity, stats]);

  if (authLoading) {
    return <ToolSkeleton variant="dashboard" />;
  }

  if (!currentUser) {
    return (
      <LoginRequired message="Your dashboard keeps Tamil practice history secure per user." />
    );
  }

  const displayName = getDisplayName(currentUser);

  return (
    <section className="page-shell fade-in">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back${displayName ? `, ${displayName}` : ""}`}
        description="A quick view of your Tamil learning activity, recent practice, and next actions."
        action={
          <Button as={Link} to="/translator">
            Start translating
            <Icon name="arrow" className="h-4 w-4" />
          </Button>
        }
      />

      {error && (
        <ErrorAlert
          className="mb-6"
          title="Dashboard unavailable"
          description={error}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <StatCard
            key={item.label}
            title={item.label}
            value={loading ? "..." : item.value}
            icon={item.icon}
            trend={item.detail}
            iconAccent={item.icon === "mic" ? "gold" : "indigo"}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Recent Activity</h2>
              <p className="mt-1 helper-text">
                Timeline of successful AI actions saved for this signed-in user.
              </p>
            </div>
            <Icon name="progress" className="h-6 w-6 text-indigo-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500">
                  {["Feature", "Details", "Amount", "When"].map((heading) => (
                    <th key={heading} className="py-3 pr-5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activity.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-gray-500" colSpan="4">
                      No activity yet. Try a translation to get started.
                    </td>
                  </tr>
                ) : (
                  activity.slice(0, 8).map((item) => (
                    <tr key={item.id} className="transition hover:bg-gray-50">
                      <td className="py-4 pr-5">
                        <span className="badge border-indigo-100 bg-indigo-50 text-indigo-700">
                          {item.label || item.feature}
                        </span>
                      </td>
                      <td className="py-4 pr-5 text-sm text-gray-600">
                        {getActivityDetail(item)}
                      </td>
                      <td className="py-4 pr-5 text-sm font-semibold text-gray-950">
                        +{item.amount}
                      </td>
                      <td className="py-4 pr-5 text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h2 className="section-title">Quick Actions</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Translate text", "/translator", "translate"],
                ["Generate sentence", "/sentence", "sentence"],
                ["Check pronunciation", "/pronunciation", "mic"],
                ["Scan image", "/ocr", "scan"],
              ].map(([label, href, icon]) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <span className="flex items-center gap-3">
                    <Icon name={icon} className="h-4 w-4" />
                    {label}
                  </span>
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Learning Progress</h2>
            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                  <span>Recent pronunciation accuracy</span>
                  <span>{averageAccuracy}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full progress-gold transition-all"
                    style={{ width: `${Math.min(averageAccuracy, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                  <span>Total practice actions</span>
                  <span>{totalActions}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full progress-gold transition-all"
                    style={{ width: `${Math.min(totalActions * 6, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
