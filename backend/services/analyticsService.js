const { supabase } = require("../config/supabase");

const FEATURE_CONFIG = Object.freeze({
  translation: {
    countField: "totalTranslations",
    label: "Translation",
  },
  ocr: {
    countField: "ocrScans",
    label: "OCR Scan",
  },
  pronunciation: {
    countField: "pronunciationAttempts",
    label: "Pronunciation Attempt",
  },
  sentence: {
    countField: "sentenceGenerations",
    label: "Sentence Generation",
  },
  entity: {
    countField: "entityAnalyses",
    label: "Entity Analysis",
  },
});

const sanitizeMetadata = (metadata = {}) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.entries(metadata).reduce((accumulator, [key, value]) => {
    if (typeof key === "string" && key.length <= 80) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
};

const recordFeatureUsage = async ({
  userId,
  feature,
  amount = 1,
  metadata = {},
}) => {
  if (!userId || !FEATURE_CONFIG[feature]) {
    return null;
  }

  const config = FEATURE_CONFIG[feature];
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("analytics, points, current_streak, best_streak, last_active_date")
    .eq("id", userId)
    .single();

  if (userError && userError.code !== "PGRST116") {
    throw userError;
  }

  if (!user) {
    await supabase.from("users").insert({
      id: userId,
      analytics: {},
      points: 0,
      current_streak: 0,
      best_streak: 0,
      last_active_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const existingAnalytics = user?.analytics || {};
  const updatedAnalytics = {
    ...existingAnalytics,
    [config.countField]: (existingAnalytics[config.countField] || 0) + amount,
  };

  const todayDate = new Date().toISOString().slice(0, 10);
  const lastDate = user?.last_active_date ? String(user.last_active_date).slice(0, 10) : null;
  const isFirstSessionToday = lastDate !== todayDate;

  const pointsToAdd = isFirstSessionToday ? 10 : 5;
  const updatedPoints = (user?.points || 0) + pointsToAdd;

  let updatedCurrentStreak = user?.current_streak || 0;
  if (isFirstSessionToday) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);
    updatedCurrentStreak = lastDate === yesterdayDate ? updatedCurrentStreak + 1 : 1;
  }
  const updatedBestStreak = Math.max(user?.best_streak || 0, updatedCurrentStreak);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      analytics: updatedAnalytics,
      points: updatedPoints,
      current_streak: updatedCurrentStreak,
      best_streak: updatedBestStreak,
      last_active_date: todayDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  const { error: logError } = await supabase.from("activity_logs").insert({
    user_id: userId,
    feature,
    count_field: config.countField,
    label: config.label,
    amount,
    metadata: sanitizeMetadata(metadata),
    created_at: new Date().toISOString(),
  });

  if (logError) {
    throw logError;
  }

  return null;
};

module.exports = {
  FEATURE_CONFIG,
  recordFeatureUsage,
};
