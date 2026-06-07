const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { recordFeatureUsage } = require("../services/analyticsService");
const { generateJson } = require("../services/geminiService");

const router = express.Router();

const GENERATOR_SYSTEM_PROMPT = `
You are Ainthamizh AI's Tamil grammar sentence and dialogue generator.
Task: Generate a grammatically correct Tamil sentence or short two-line dialogue from the exact noun, verb, tense, and gender provided.
Rules:
- Return only valid JSON. No markdown or extra text.
- Use the provided parameters strictly. Do not switch tense, gender, noun, or verb.
- Output must be Tamil Unicode script.
- Include a brief Tamil grammar note explaining the tense/gender agreement.
- If mode is "dialogue", generate exactly two dialogue lines. Otherwise generate one sentence.
- Keep the content safe, educational, and natural.
Required JSON shape:
{
  "mode": "sentence|dialogue",
  "parameters": {
    "noun": "string",
    "verb": "string",
    "tense": "past|present|future",
    "gender": "male|female|neutral|plural"
  },
  "sentence": "Tamil sentence",
  "dialogue": ["line 1", "line 2"],
  "transliteration": "romanized Tamil",
  "grammarNoteTamil": "தமிழில் குறுகிய இலக்கண விளக்கம்"
}
`;

const allowedTenses = new Set(["past", "present", "future"]);
const allowedGenders = new Set(["male", "female", "neutral", "plural"]);
const allowedModes = new Set(["sentence", "dialogue"]);

const cleanRequiredString = (body, key) => {
  const value = body[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error(`${key} is required and must be a non-empty string.`);
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  if (value.length > 120) {
    const error = new Error(`${key} must be 120 characters or less.`);
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  return value.trim();
};

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const noun = cleanRequiredString(req.body, "noun");
    const verb = cleanRequiredString(req.body, "verb");
    const tense = cleanRequiredString(req.body, "tense").toLowerCase();
    const gender = cleanRequiredString(req.body, "gender").toLowerCase();
    const mode =
      typeof req.body.mode === "string" && req.body.mode.trim()
        ? req.body.mode.trim().toLowerCase()
        : "sentence";

    if (!allowedTenses.has(tense)) {
      const error = new Error("tense must be one of: past, present, future.");
      error.statusCode = 400;
      error.name = "BadRequest";
      throw error;
    }

    if (!allowedGenders.has(gender)) {
      const error = new Error(
        "gender must be one of: male, female, neutral, plural.",
      );
      error.statusCode = 400;
      error.name = "BadRequest";
      throw error;
    }

    if (!allowedModes.has(mode)) {
      const error = new Error("mode must be either sentence or dialogue.");
      error.statusCode = 400;
      error.name = "BadRequest";
      throw error;
    }

    const result = await generateJson({
      systemInstruction: GENERATOR_SYSTEM_PROMPT,
      temperature: 0.25,
      contents: JSON.stringify({
        instruction:
          "Generate Tamil output using only these grammar parameters.",
        noun,
        verb,
        tense,
        gender,
        mode,
      }),
    });

    await recordFeatureUsage({
      userId: req.user.uid,
      feature: "sentence",
      metadata: { noun, verb, tense, gender, mode },
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
