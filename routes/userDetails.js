const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");
const validator = require("../utils/validators");

const router = express.Router();

router.get("/user", authentificate, async (req, res) => {
  try {
    const idNum = req.user.id;

    const result = await pgPool.query(
      `
          SELECT user_id, user_name, email
          FROM users
          WHERE user_id = $1
          `,
      [idNum]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      message: "User details",
      user: {
        id: user.user_id,
        username: user.user_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Interal server error",
    });
  }
});

module.exports = router;
