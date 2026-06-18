const express = require("express");

const { supabase } = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

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

const DEFAULT_ANALYTICS = Object.freeze({
  totalTranslations: 0,
  ocrScans: 0,
  pronunciationAttempts: 0,
  sentenceGenerations: 0,
  entityAnalyses: 0,
});

const MAX_ACTIVITY_LIMIT = 50;

const createHttpError = (statusCode, message, name = "Error") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;
  return error;
};

const ensureOwnUserAccess = (req, userId) => {
  const isAdmin = req.user.claims?.admin === true;

  if (req.user.uid !== userId && !isAdmin) {
    throw createHttpError(
      403,
      "You are not allowed to access analytics for this user.",
      "Forbidden",
    );
  }
};

const parseLimit = (value) => {
  if (value === undefined) {
    return 20;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_ACTIVITY_LIMIT) {
    throw createHttpError(
      400,
      `limit must be an integer between 1 and ${MAX_ACTIVITY_LIMIT}.`,
      "BadRequest",
    );
  }

  return parsed;
};

const serializeActivity = (activity) => ({
  id: activity.id,
  feature: activity.feature,
  countField: activity.count_field,
  label: activity.label,
  amount: activity.amount,
  metadata: activity.metadata || {},
  createdAt: activity.created_at || null,
});

const normalizeMetadata = (metadata) => {
  if (metadata === undefined) {
    return {};
  }

  if (
    metadata === null ||
    Array.isArray(metadata) ||
    typeof metadata !== "object"
  ) {
    throw createHttpError(400, "metadata must be a JSON object.", "BadRequest");
  }

  return Object.entries(metadata).reduce((accumulator, [key, value]) => {
    if (typeof key === "string" && key.length <= 80) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
};

router.use(authMiddleware);

router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { data: user, error } = await supabase
      .from("users")
      .select("analytics")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      userId,
      stats: {
        ...DEFAULT_ANALYTICS,
        ...(user.analytics || {}),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const limit = parseLimit(req.query.limit);

    const { data: activities, error: activityError } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (activityError) {
      throw activityError;
    }

    return res.status(200).json({
      userId,
      activity: (activities || []).map(serializeActivity),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/increment", async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user.uid;
    const feature = typeof req.body.feature === "string" ? req.body.feature : "";
    const amount = req.body.amount === undefined ? 1 : Number(req.body.amount);
    const config = FEATURE_CONFIG[feature];

    ensureOwnUserAccess(req, userId);

    if (!config) {
      return res.status(400).json({
        error: "Bad Request",
        message: `feature must be one of: ${Object.keys(FEATURE_CONFIG).join(
          ", ",
        )}.`,
      });
    }

    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return res.status(400).json({
        error: "Bad Request",
        message: "amount must be an integer between 1 and 100.",
      });
    }

    const metadata = normalizeMetadata(req.body.metadata);
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
        analytics: DEFAULT_ANALYTICS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const existingAnalytics = user?.analytics || DEFAULT_ANALYTICS;
    const updatedAnalytics = {
      ...DEFAULT_ANALYTICS,
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
      metadata,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      throw logError;
    }

    return res.status(200).json({
      message: "Analytics updated.",
      userId,
      stats: updatedAnalytics,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
