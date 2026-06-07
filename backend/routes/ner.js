const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { recordFeatureUsage } = require("../services/analyticsService");
const { generateJson } = require("../services/geminiService");

const router = express.Router();

const MAX_TEXT_LENGTH = 6000;

const NER_SYSTEM_PROMPT = `
You are Ainthamizh AI's Tamil named-entity recognition and explanation engine.
Task: Read Tamil text, identify named entities and important concepts, then explain each one in helpful Tamil.
Entity types allowed: PERSON, LOCATION, ORGANIZATION, DATE, CONCEPT.
Rules:
- Return only valid JSON. No markdown, no prose outside JSON.
- Keep entity surface text exactly as it appears in the input.
- Explanations must be in Tamil, concise, and useful for a Tamil learner.
- If no entities exist, return an empty entities array and a short Tamil summary.
- Do not invent facts that are not implied by the text.
Required JSON shape:
{
  "language": "ta",
  "summary": "தமிழில் ஒரு சுருக்கம்",
  "entities": [
    {
      "text": "input span",
      "type": "PERSON|LOCATION|ORGANIZATION|DATE|CONCEPT",
      "startHint": "nearby words or null",
      "explanationTamil": "தமிழில் விளக்கம்",
      "confidence": 0.0
    }
  ]
}
`;

const validateText = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error("text is required and must be a non-empty Tamil string.");
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

    const result = await generateJson({
      systemInstruction: NER_SYSTEM_PROMPT,
      temperature: 0.1,
      contents: `Analyze this Tamil text for named entities and explain them:\n${text}`,
    });

    await recordFeatureUsage({
      userId: req.user.uid,
      feature: "entity",
      metadata: {
        inputLength: text.length,
        entityCount: Array.isArray(result.entities) ? result.entities.length : 0,
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
