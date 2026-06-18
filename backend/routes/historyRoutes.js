const express = require("express");

const { supabase } = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const MAX_LIMIT = 100;

const createHttpError = (statusCode, message, name = "Error") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;
  return error;
};

const parseLimit = (value) => {
  if (value === undefined) {
    return 25;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw createHttpError(
      400,
      `limit must be an integer between 1 and ${MAX_LIMIT}.`,
      "BadRequest",
    );
  }

  return parsed;
};

const serializeHistory = (row) => ({
  id: row.id,
  userId: row.user_id,
  feature: row.feature,
  countField: row.count_field,
  label: row.label,
  amount: row.amount,
  metadata: row.metadata || {},
  createdAt: row.created_at,
});

router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const feature =
      typeof req.query.feature === "string" && req.query.feature.trim()
        ? req.query.feature.trim()
        : null;

    let query = supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", req.user.uid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (feature) {
      query = query.eq("feature", feature);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      userId: req.user.uid,
      history: (data || []).map(serializeHistory),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.uid && req.user.claims?.admin !== true) {
      throw createHttpError(
        403,
        "You are not allowed to access this user's history.",
        "Forbidden",
      );
    }

    const limit = parseLimit(req.query.limit);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      userId,
      history: (data || []).map(serializeHistory),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
