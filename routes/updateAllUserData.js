const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");
const validator = require("../utils/validators");
const { hashPass } = require("../utils/hash");

const router = express.Router();

router.put("/user", authentificate, async (req, res) => {
  try {
    let { username, email, password } = req?.body || {};

    if (!validator.isAllFieldExists([username, email, password])) {
      return res
        .status(400)
        .json({ message: "Missing field. Username, email and password are required." });
    }

    username = username.trim();

    //unique username validation
    //username length validation 3 to 35
    if (!validator.isValidUsername(username)) {
      return res.status(400).json({ message: "Username length must be between 3 and 32" });
    }

    if (await validator.isUsernameExists(username, req.user.id)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    //email validation unique
    //email format validation
    if (!validator.isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (await validator.isEmailExists(email, req.user.id)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!validator.isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be in numerical and alphabetical characters, length must be between 3 and 32 characters",
      });
    }

    const result = await pgPool.query(
      `
        UPDATE users
        SET user_name = $1, email = $2, password = $3
        WHERE user_id = $4
        RETURNING *
    `,
      [username, email, await hashPass(password), req.user.id]
    );

    if (result.rowCount > 0) {
      const user = result?.rows[0];
      res.json({
        message: "User updated",
        user: {
          id: user.user_id,
          username: user.user_name,
          email: user.email,
        },
      });
    } else {
      res.status(400).json({
        message: "User not updated",
      });
    }
  } catch (err) {
    console.error("update all data error", err);
    res.status(500).json({
      message: "Internal erver error",
    });
  }
});

module.exports = router;
