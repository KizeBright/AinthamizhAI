const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Entity routes are not implemented. Use /api/ner for entity analysis.",
  });
});

module.exports = router;
