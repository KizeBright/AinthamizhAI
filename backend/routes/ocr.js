const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { recordFeatureUsage } = require("../services/analyticsService");
const { generateJson } = require("../services/geminiService");
const { transliterateTanglish } = require("../services/tanglishService");
const { runTesseract } = require("../services/ocrService");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const conditionalBody = (req, res, next) => {
  const contentType = (req.headers["content-type"] || "").toLowerCase();

  if (contentType.startsWith("multipart/form-data")) {
    return upload.single("file")(req, res, next);
  }

  return express.raw({
    type: ["image/*", "application/octet-stream"],
    limit: "10mb",
  })(req, res, next);
};

const router = express.Router();

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_IMAGE_MIME_TYPE = "image/png";

const OCR_SYSTEM_PROMPT = `
You are Ainthamizh AI's OCR engine for Tanglish and handwritten learning notes.
Task: Read the provided image and extract visible Tanglish/romanized Tamil text.
Rules:
- Return only valid JSON. No markdown and no text outside JSON.
- Extract text exactly as seen where possible.
- Preserve line breaks in extractedText when useful.
- If the image contains Tamil Unicode text, include it in extractedText too.
- Do not invent text if it is unreadable; report uncertainty instead.
Required JSON shape:
{
  "extractedText": "visible Tanglish or Tamil text",
  "lines": ["line 1", "line 2"],
  "confidence": 0.0,
  "notes": "brief OCR uncertainty notes"
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

const getImagePayload = (req) => {
  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    if (req.body.length > MAX_IMAGE_BYTES) {
      const error = new Error("Image payload is too large.");
      error.statusCode = 413;
      error.name = "PayloadTooLarge";
      throw error;
    }

    return {
      base64: req.body.toString("base64"),
      mimeType:
        (req.headers["content-type"] || "").split(";")[0] ||
        DEFAULT_IMAGE_MIME_TYPE,
    };
  }

  const imageValue = req.body.imageBase64 || req.body.image || req.body.data;

  if (typeof imageValue !== "string" || imageValue.trim().length === 0) {
    const error = new Error(
      "Provide image as raw binary or as imageBase64 in the JSON body.",
    );
    error.statusCode = 400;
    error.name = "BadRequest";
    throw error;
  }

  const dataUrl = parseDataUrl(imageValue.trim());
  const base64 = normalizeBase64(dataUrl ? dataUrl.base64 : imageValue);
  const byteLength = Buffer.byteLength(base64, "base64");

  if (byteLength > MAX_IMAGE_BYTES) {
    const error = new Error("Image payload is too large.");
    error.statusCode = 413;
    error.name = "PayloadTooLarge";
    throw error;
  }

  return {
    base64,
    mimeType: dataUrl ? dataUrl.mimeType : req.body.mimeType || DEFAULT_IMAGE_MIME_TYPE,
  };
};

router.post("/", authMiddleware, conditionalBody, async (req, res, next) => {
  try {
    let image;

    if (req.file && req.file.buffer) {
      const byteLength = req.file.buffer.length;

      if (byteLength > MAX_IMAGE_BYTES) {
        const error = new Error("Image payload is too large.");
        error.statusCode = 413;
        error.name = "PayloadTooLarge";
        throw error;
      }

      image = {
        base64: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype || DEFAULT_IMAGE_MIME_TYPE,
      };
    } else {
      image = getImagePayload(req);
    }

    if (!image.mimeType.startsWith("image/")) {
      const error = new Error("Image mimeType must start with image/.");
      error.statusCode = 400;
      error.name = "BadRequest";
      throw error;
    }

    const ocrResult = await generateJson({
      systemInstruction: OCR_SYSTEM_PROMPT,
      temperature: 0.05,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract Tanglish or Tamil text from this image for a Tamil learning app.",
            },
            {
              inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
              },
            },
          ],
        },
      ],
    });

    let extractedText =
      typeof ocrResult.extractedText === "string"
        ? ocrResult.extractedText.trim()
        : "";

    // Fallback to local Tesseract if generative OCR returns nothing
    if (!extractedText) {
      try {
        const localText = await runTesseract(image.base64, "eng");

        if (localText && localText.trim().length > 0) {
          extractedText = localText.trim();
        }
      } catch (e) {
        // ignore fallback errors
      }
    }

    if (!extractedText) {
      const error = new Error("No readable text was found in the image.");
      error.statusCode = 422;
      error.name = "UnprocessableEntity";
      throw error;
    }

    const translationResult = await transliterateTanglish(extractedText);

    await recordFeatureUsage({
      userId: req.user.uid,
      feature: "ocr",
      metadata: {
        extractedLength: extractedText.length,
        mimeType: image.mimeType,
        confidence: ocrResult.confidence || null,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ocr: ocrResult,
        tamil: translationResult,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
