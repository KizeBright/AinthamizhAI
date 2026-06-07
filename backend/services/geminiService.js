require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client;

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "Gemini API key is not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY.",
    );
    error.statusCode = 500;
    error.name = "ConfigurationError";
    throw error;
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
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
  const response = await getGeminiClient().models.generateContent({
    model,
    contents,
    config: createGenerationConfig({
      systemInstruction,
      temperature,
      responseMimeType,
    }),
  });

  const text = extractResponseText(response);

  if (!text) {
    const error = new Error("Gemini returned an empty response.");
    error.statusCode = 502;
    error.name = "BadGateway";
    throw error;
  }

  return text;
};

const generateJson = async (options) => {
  const text = await generateText(options);
  return parseJsonResponse(text);
};

module.exports = {
  DEFAULT_MODEL,
  generateJson,
  generateText,
};
