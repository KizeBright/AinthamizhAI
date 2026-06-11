const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  res.status(501).json({
    error: "Not Implemented",
    message: "Legacy OCR route is not implemented. Use /api/ocr instead.",
  });
});

module.exports = router;
