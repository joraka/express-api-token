const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");

const router = express.Router();

router.get("/users", authentificate, async (req, res) => {
  try {
    const result = await pgPool.query(
      `
          SELECT user_id, user_name, email
          FROM users
          `
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No users found",
      });
    }

    res.status(200).json({
      message: "All users",
      users: result.rows.map(({ user_id, user_name, email }) => ({
        id: user_id,
        username: user_name,
        email,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Interal server error",
    });
  }
});

module.exports = router;
