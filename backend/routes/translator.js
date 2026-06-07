const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { recordFeatureUsage } = require("../services/analyticsService");
const { transliterateTanglish } = require("../services/tanglishService");

const router = express.Router();

const MAX_TEXT_LENGTH = 2000;

const validateText = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error("text is required and must be a non-empty string.");
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  if (value.length > MAX_TEXT_LENGTH) {
    const error = new Error(`text must be ${MAX_TEXT_LENGTH} characters or less.`);
    error.statusCode = 413;
    error.name = "PayloadTooLarge";
    throw error;
  }

  return value.trim();
};

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const text = validateText(req.body.text);
    const result = await transliterateTanglish(text);

    await recordFeatureUsage({
      userId: req.user.uid,
      feature: "translation",
      metadata: {
        inputLength: text.length,
        outputLength: result.tamilText ? result.tamilText.length : 0,
      },
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
