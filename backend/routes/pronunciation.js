const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { recordFeatureUsage } = require("../services/analyticsService");
const { generateJson } = require("../services/geminiService");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const conditionalBody = (req, res, next) => {
  const contentType = (req.headers["content-type"] || "").toLowerCase();

  if (contentType.startsWith("multipart/form-data")) {
    return upload.single("file")(req, res, next);
  }

  return express.raw({
    type: ["audio/*", "application/octet-stream"],
    limit: "15mb",
  })(req, res, next);
};

const router = express.Router();

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const DEFAULT_AUDIO_MIME_TYPE = "audio/webm";

const PRONUNCIATION_SYSTEM_PROMPT = `
You are Ainthamizh AI's Tamil pronunciation validator.
Task: Transcribe the user's Tamil speech from audio and compare it conceptually against the provided target Tamil text.
Rules:
- Return only valid JSON. No markdown and no text outside JSON.
- The transcript must be Tamil Unicode when Tamil is spoken.
- Focus on Tamil pronunciation, missing syllables, substitutions, and difficult sounds.
- Include learner-friendly feedback in English plus Tamil examples where useful.
- Do not fabricate words that are not audible. Use an empty transcript if the audio is unintelligible.
Required JSON shape:
{
  "transcript": "recognized Tamil text",
  "confidence": 0.0,
  "phonemeIssues": [
    {
      "sound": "ழ்",
      "issue": "what sounded wrong",
      "feedback": "Pronounce 'ழ்' clearly by curling the tongue slightly."
    }
  ],
  "overallFeedback": "short practical feedback"
}
`;

const parseDataUrl = (value) => {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(value);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
};

const normalizeBase64 = (value) => value.replace(/\s/g, "");

const getBase64Payload = (req) => {
  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    if (req.body.length > MAX_AUDIO_BYTES) {
      const error = new Error("Audio payload is too large.");
      error.statusCode = 413;
      error.name = "PayloadTooLarge";
      throw error;
    }

    return {
      base64: req.body.toString("base64"),
      mimeType:
        (req.headers["content-type"] || "").split(";")[0] ||
        DEFAULT_AUDIO_MIME_TYPE,
    };
  }

  const audioValue = req.body.audioBase64 || req.body.audio || req.body.data;

  if (typeof audioValue !== "string" || audioValue.trim().length === 0) {
    const error = new Error(
      "Provide audio as raw binary or as audioBase64 in the JSON body.",
    );
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  const dataUrl = parseDataUrl(audioValue.trim());
  const base64 = normalizeBase64(dataUrl ? dataUrl.base64 : audioValue);
  const byteLength = Buffer.byteLength(base64, "base64");

  if (byteLength > MAX_AUDIO_BYTES) {
    const error = new Error("Audio payload is too large.");
    error.statusCode = 413;
    error.name = "PayloadTooLarge";
    throw error;
  }

  return {
    base64,
    mimeType: dataUrl ? dataUrl.mimeType : req.body.mimeType || DEFAULT_AUDIO_MIME_TYPE,
  };
};

const getTargetText = (req) => {
  const targetText =
    req.body.targetText || req.query.targetText || req.headers["x-target-text"];

  if (typeof targetText !== "string" || targetText.trim().length === 0) {
    const error = new Error("targetText is required.");
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  if (targetText.length > 1000) {
    const error = new Error("targetText must be 1000 characters or less.");
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  return targetText.trim();
};

const normalizeTamilText = (value) =>
  String(value || "")
    .normalize("NFC")
    .replace(/[.,!?;:"'`~()[\]{}|/\\<>@#$%^&*_+=\-\u2013\u2014]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const levenshteinDistance = (left, right) => {
  const a = Array.from(left);
  const b = Array.from(right);
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + substitutionCost,
      );
    }
  }

  return dp[a.length][b.length];
};

const calculateAccuracy = (targetText, transcript) => {
  const target = normalizeTamilText(targetText);
  const actual = normalizeTamilText(transcript);

  if (!target || !actual) {
    return 0;
  }

  const maxLength = Math.max(Array.from(target).length, Array.from(actual).length);
  const distance = levenshteinDistance(target, actual);

  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
};

const buildFallbackFeedback = (targetText, transcript, accuracy) => {
  if (!transcript) {
    return "The audio was unclear. Try speaking closer to the microphone.";
  }

  if (accuracy >= 85) {
    return "Strong pronunciation. Keep the same pace and clarity.";
  }

  if (targetText.includes("ழ") || targetText.includes("ழ்")) {
    return "Pronounce 'ழ்' clearly by curling the tongue slightly.";
  }

  return "Repeat the sentence slowly and make each Tamil syllable distinct.";
};

router.post("/", authMiddleware, conditionalBody, async (req, res, next) => {
  try {
    const targetText = getTargetText(req);

    let audio;

    if (req.file && req.file.buffer) {
      const byteLength = req.file.buffer.length;

      if (byteLength > MAX_AUDIO_BYTES) {
        const error = new Error("Audio payload is too large.");
        error.statusCode = 413;
        error.name = "PayloadTooLarge";
        throw error;
      }

      audio = {
        base64: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype || DEFAULT_AUDIO_MIME_TYPE,
      };
    } else {
      audio = getBase64Payload(req);
    }

  if (
  !audio.mimeType.startsWith("audio/") &&
  audio.mimeType !== "video/webm"
) {
  const error = new Error(
    "Audio mimeType must be audio/* or video/webm."
  );
  error.statusCode = 400;
  error.name = "BadRequest";
  throw error;
}

if (audio.mimeType === "video/webm") {
  audio.mimeType = "audio/webm";
}

    const result = await generateJson({
      systemInstruction: PRONUNCIATION_SYSTEM_PROMPT,
      temperature: 0.1,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Target Tamil text: ${targetText}\nTranscribe this audio and evaluate pronunciation.`,
            },
            {
              inlineData: {
                data: audio.base64,
                mimeType: audio.mimeType,
              },
            },
          ],
        },
      ],
    });

    const transcript = typeof result.transcript === "string" ? result.transcript : "";
    const accuracy = calculateAccuracy(targetText, transcript);
    const feedback =
      result.overallFeedback || buildFallbackFeedback(targetText, transcript, accuracy);

    await recordFeatureUsage({
      userId: req.user.uid,
      feature: "pronunciation",
      metadata: {
        targetLength: targetText.length,
        transcriptLength: transcript.length,
        accuracy,
        mimeType: audio.mimeType,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        targetText,
        transcript,
        accuracy,
        confidence: result.confidence || null,
        feedback,
        phonemeIssues: Array.isArray(result.phonemeIssues)
          ? result.phonemeIssues
          : [],
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
