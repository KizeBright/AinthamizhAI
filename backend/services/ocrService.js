const { createWorker } = require("tesseract.js");

const runTesseract = async (base64, lang = "eng+tam") => {
  const worker = await createWorker(lang);

  try {
    const buffer = Buffer.from(base64, "base64");
    const { data } = await worker.recognize(buffer);
    return data.text || "";
  } finally {
    try {
      await worker.terminate();
    } catch (e) {
      // ignore
    }
  }
};

module.exports = { runTesseract };
