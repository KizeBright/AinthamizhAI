const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "History routes are not implemented. Use /api/analytics instead.",
  });
});

module.exports = router;
