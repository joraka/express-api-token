const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");
const validator = require("../utils/validators");
const { addTokenToBlacklist } = require("../utils/jwt");

const router = express.Router();

router.delete("/user", authentificate, async (req, res) => {
  try {
    const result = await pgPool.query("DELETE FROM users WHERE user_id = $1", [req.user.id]);

    if (result.rowCount > 0) {
      await addTokenToBlacklist(req.user.token);
      res.json({ message: "User deleted" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
