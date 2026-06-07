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
    .select("analytics")
    .eq("id", userId)
    .single();

  if (userError && userError.code !== "PGRST116") {
    throw userError;
  }

  if (!user) {
    await supabase.from("users").insert({
      id: userId,
      analytics: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const existingAnalytics = user?.analytics || {};
  const updatedAnalytics = {
    ...existingAnalytics,
    [config.countField]: (existingAnalytics[config.countField] || 0) + amount,
  };

  const { error: updateError } = await supabase
    .from("users")
    .update({ analytics: updatedAnalytics, updated_at: new Date().toISOString() })
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
