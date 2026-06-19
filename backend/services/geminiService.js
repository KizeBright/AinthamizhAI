require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const keys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

if (keys.length === 0) {
  const k = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (k) keys.push(k);
}

let current = 0;

const getKey = () => {
  if (keys.length === 0) {
    const error = new Error("No Gemini API key configured. Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3 or GEMINI_API_KEY.");
    error.statusCode = 500;
    error.name = "ConfigurationError";
    throw error;
  }
  const key = keys[current];
  current = (current + 1) % keys.length;
  return key;
};

const createGenerationConfig = ({
  systemInstruction,
  temperature = 0.1,
  responseMimeType = "application/json",
} = {}) => ({
  systemInstruction,
  temperature,
  responseMimeType,
});

const extractResponseText = (response) => {
  if (typeof response.text === "string") {
    return response.text.trim();
  }

  if (typeof response.text === "function") {
    return response.text().trim();
  }

  return "";
};

const stripJsonFences = (value) =>
  value
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(stripJsonFences(text));
  } catch (error) {
    const wrappedError = new Error("Gemini returned invalid JSON.");
    wrappedError.statusCode = 502;
    wrappedError.name = "BadGateway";
    wrappedError.details = text;
    throw wrappedError;
  }
};

const generateText = async ({
  contents,
  systemInstruction,
  temperature = 0.1,
  responseMimeType = "application/json",
  model = DEFAULT_MODEL,
}) => {
  const maxAttempts = Math.max(keys.length, 3);
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const client = new GoogleGenAI({ apiKey: getKey() });
      const response = await client.models.generateContent({
        model,
        contents,
        config: createGenerationConfig({ systemInstruction, temperature, responseMimeType }),
      });

      const text = extractResponseText(response);
      if (!text) {
        const error = new Error("Gemini returned an empty response.");
        error.statusCode = 502;
        error.name = "BadGateway";
        throw error;
      }
      return text;
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      // Only retry on 503 (overloaded) or 429 (rate limit)
      if (status === 503 || status === 429) {
        const delay = 1000 * (attempt + 1);
        console.warn(`[gemini] attempt ${attempt + 1} failed (${status}), retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
};

const generateJson = async (options) => {
  const text = await generateText(options).catch((err) => {
    const status = err?.status || err?.statusCode;
    if (status === 503) {
      const friendly = new Error("The AI service is temporarily overloaded. Please wait a few seconds and try again.");
      friendly.statusCode = 503;
      friendly.name = "ServiceUnavailable";
      throw friendly;
    }
    if (status === 429) {
      const friendly = new Error("Too many requests. Please wait a moment and try again.");
      friendly.statusCode = 429;
      friendly.name = "TooManyRequests";
      throw friendly;
    }
    throw err;
  });
  return parseJsonResponse(text);
};

module.exports = {
  DEFAULT_MODEL,
  generateJson,
  generateText,
};
