const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");
const validator = require("../utils/validators");
const { hashPass, compareHashPass } = require("../utils/hash");
const jwt = require("../utils/jwt");

const router = express.Router();

router.post("/user", async (req, res) => {
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

    if (await validator.isUsernameExists(username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    //email validation unique
    //email format validation
    if (!validator.isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (await validator.isEmailExists(email)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    //possword validation - length 8 to 32,
    //password validation - only numbers and alphabetical characters
    if (!validator.isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be in numerical and alphabetical characters, length must be between 3 and 32 characters",
      });
    }
    try {
      const hashedPass = await hashPass(password);

      const result = await pgPool.query(
        `
      INSERT INTO users (user_name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [username, email, hashedPass]
      );

      const dbUser = result.rows[0];

      res.json({
        message: "User created",
        user: {
          id: dbUser.user_id,
          username: dbUser.user_name,
          email: dbUser.email,
        },
      });
    } catch (dbErr) {
      console.log("Database error", dbErr);
      res.status(500).json({ message: "Database error" });
    }
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
