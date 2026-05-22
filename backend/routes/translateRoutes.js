const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    res.json({
      output: `தமிழ் மொழிபெயர்ப்பு: ${text}`,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;