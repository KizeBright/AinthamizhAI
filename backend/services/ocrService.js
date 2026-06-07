const { createWorker } = require("tesseract.js");

const runTesseract = async (base64, lang = "eng") => {
  const worker = createWorker();

  try {
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);

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

module.exports = {
  runTesseract,
};
