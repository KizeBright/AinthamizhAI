import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  ErrorAlert,
  Icon,
  Skeleton,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { notify } from "../utils/notifications";

function Profile() {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingStreaks, setLoadingStreaks] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    photoURL: "",
    preferredLevel: "",
    nativeLanguage: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const emailReadOnly = currentUser?.email || "";

  useEffect(() => {
    if (!currentUser) return;

    const loadProfile = async () => {
      setError("");
      try {
        const res = await API.get("/auth/me");
        const user = res.data?.user;
        setProfile(user || null);
        setForm({
          displayName: user?.display_name || "",
          photoURL: user?.photo_url || "",
          preferredLevel: user?.preferred_level || "",
          nativeLanguage: user?.native_language || "",
        });
      } catch (e) {
        // profile is optional (we still allow password change)
        setProfile(null);
        setError(e?.response?.data?.message || "Unable to load profile.");
      }
    };

    const loadStreaks = async () => {
      setLoadingStreaks(true);
      try {
        const res = await API.get("/auth/streaks");
        setStreaks(res.data?.streaks || null);
      } catch (e) {
        setStreaks(null);
      } finally {
        setLoadingStreaks(false);
      }
    };

    loadProfile();
    loadStreaks();
  }, [currentUser]);

  const streakSummary = useMemo(() => {
    if (!streaks) return { current: 0, best: 0, points: 0, days: [] };
    return {
      current: streaks.current ?? 0,
      best: streaks.best ?? 0,
      points: streaks.points ?? 0,
      days: streaks.days || [],
    };
  }, [streaks]);

  const updateField = (key, value) => {
    setForm((cur) => ({ ...cur, [key]: value }));
  };

  const updatePasswordField = (key, value) => {
    setPasswordForm((cur) => ({ ...cur, [key]: value }));
  };

  const savePersonalDetails = async () => {
    setSaving(true);
    setError("");

    try {
      // IMPORTANT: do not send email field. Backend enforces it.
      await API.post("/auth/profile", {
        displayName: form.displayName,
        photoURL: form.photoURL,
        preferredLevel: form.preferredLevel,
        nativeLanguage: form.nativeLanguage,
      });

      notify.success("Profile updated.");
      // refresh local profile
      const res = await API.get("/auth/me");
      setProfile(res.data?.user || null);
    } catch (e) {
      const message = e?.response?.data?.message || "Unable to update profile.";
      setError(message);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");

    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await API.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });

      notify.success("Password updated. Please login again if required.");

      // Optional: logout to force re-auth for safety
      await logout();
    } catch (e) {
      const message = e?.response?.data?.message || "Password change failed.";
      setError(message);
      notify.error(message);
    }
  };

  if (authLoading) {
    return (
      <section className="page-shell fade-in">
        <Skeleton className="mb-4 h-10 w-60" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-5 h-20 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-5 h-64 w-full" />
          </Card>
        </div>
      </section>
    );
  }

  if (!currentUser) {
    return (
      <section className="page-shell fade-in">
        <Card className="mx-auto max-w-xl">
          <p className="text-sm font-semibold text-gray-500">Please login to view your profile.</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-shell fade-in">
      <div className="mb-8">
        <h1 className="page-title">Profile</h1>
        <p className="mt-3 helper-text">
          Manage your daily streaks and personal details. Your email cannot be changed.
        </p>
      </div>

      {error && (
        <ErrorAlert title="Profile error" description={error} className="mb-6" />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="section-title">Personal details</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="field-label">Email (read-only)</label>
                <div className="field-control cursor-not-allowed opacity-90">{emailReadOnly}</div>
              </div>

              <div>
                <label className="field-label" htmlFor="displayName">Name</label>
                <input
                  id="displayName"
                  className="field-control"
                  value={form.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="photoURL">Photo URL</label>
                <input
                  id="photoURL"
                  className="field-control"
                  value={form.photoURL}
                  onChange={(e) => updateField("photoURL", e.target.value)}
                  placeholder="https://..."
                />
                <p className="mt-2 helper-text">Leave blank if you don’t want to set a photo now.</p>
              </div>

              <div>
                <label className="field-label" htmlFor="preferredLevel">Preferred level</label>
                <input
                  id="preferredLevel"
                  className="field-control"
                  value={form.preferredLevel}
                  onChange={(e) => updateField("preferredLevel", e.target.value)}
                  placeholder="Beginner / Intermediate / Advanced"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="nativeLanguage">Native language</label>
                <input
                  id="nativeLanguage"
                  className="field-control"
                  value={form.nativeLanguage}
                  onChange={(e) => updateField("nativeLanguage", e.target.value)}
                  placeholder="e.g., Tamil / Telugu"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" disabled={saving} onClick={savePersonalDetails}>
                  {saving ? "Saving..." : "Save details"}
                  <Icon name="check" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Change password</h2>
            <p className="mt-2 helper-text">
              Enter your old password to set a new one.
            </p>

            <form onSubmit={changePassword} className="mt-5 space-y-4">
              <div>
                <label className="field-label" htmlFor="oldPassword">Old password</label>
                <input
                  id="oldPassword"
                  type="password"
                  className="field-control"
                  value={passwordForm.oldPassword}
                  onChange={(e) => updatePasswordField("oldPassword", e.target.value)}
                  placeholder="Enter your old password"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="field-control"
                  value={passwordForm.newPassword}
                  onChange={(e) => updatePasswordField("newPassword", e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="confirmPassword">Confirm new password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="field-control"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => updatePasswordField("confirmPassword", e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <Button type="submit" className="w-full">
                Update password
                <Icon name="arrow" className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <h2 className="section-title">Daily streak</h2>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                <Icon name="progress" />
              </span>
            </div>

            {loadingStreaks ? (
              <div className="mt-5 space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Current</p>
                    <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-gray-50">{streakSummary.current}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Best</p>
                    <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-gray-50">{streakSummary.best}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Points</p>
                    <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-gray-50">{streakSummary.points}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="section-title">Account</h2>
            <p className="mt-2 helper-text">Email stays unchanged after registration.</p>
            <div className="mt-5">
              <Button type="button" variant="secondary" className="w-full" onClick={logout}>
                Logout
                <Icon name="clear" className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default Profile;

