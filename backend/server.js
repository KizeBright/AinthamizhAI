require("dotenv").config();

const cors = require("cors");
const express = require("express");

const analyticsRoutes = require("./routes/analytics");
const authRoutes = require("./routes/auth");
const generatorRoutes = require("./routes/generator");
const nerRoutes = require("./routes/ner");
const ocrAiRoutes = require("./routes/ocr");
const pronunciationAiRoutes = require("./routes/pronunciation");
const translatorRoutes = require("./routes/translator");

const app = express();

const mountRouter = (path, router) => {
  if (typeof router === "function") {
    app.use(path, router);
  }
};

const parseAllowedOrigins = () => {
  if (!process.env.CORS_ORIGIN) {
    return true;
  }

  return process.env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

app.disable("x-powered-by");

app.use(
  cors({
    origin: parseAllowedOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || "1mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Ainthamizh AI Backend",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

mountRouter("/api/auth", authRoutes);
mountRouter("/api/analytics", analyticsRoutes);
mountRouter("/api/translator", translatorRoutes);
mountRouter("/api/ner", nerRoutes);
mountRouter("/api/generator", generatorRoutes);
mountRouter("/api/pronunciation", pronunciationAiRoutes);
mountRouter("/api/ocr", ocrAiRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
});

app.use((err, req, res, next) => {
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction && statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message:
      statusCode === 500 && isProduction
        ? "An unexpected server error occurred."
        : err.message || "An unexpected server error occurred.",
  });
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Ainthamizh AI backend running on port ${PORT}`);
});
