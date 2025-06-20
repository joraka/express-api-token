const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");
const validator = require("../utils/validators");
const { hashPass, compareHashPass } = require("../utils/hash");
const jwt = require("../utils/jwt");

const router = express.Router();

router.get("/login", async (req, res) => {
  try {
    let { username, password } = req?.body || {};

    if (!validator.isAllFieldExists([username, password])) {
      return res.status(400).json({ message: "Must have valid username and password" });
    }

    if (!validator.isValidUsername(username)) {
      return res.status(400).json({ message: "Username length must be between 3 and 32" });
    }

    if (!validator.isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be in numerical and alphabetical characters, length must be between 3 and 32 characters",
      });
    }

    const result = await pgPool.query("SELECT * FROM users WHERE user_name = $1;", [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Username or password is invalid",
      });
    }

    const dbUser = result.rows?.[0];

    const isValidPass = await compareHashPass(password, dbUser.password);

    if (!isValidPass) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    res.json({
      message: "User logged in",
      user: {
        id: dbUser.user_id,
        username: dbUser.user_name,
        email: dbUser.email,
      },
      token: jwt.generateToken({
        id: dbUser.user_id,
        username: dbUser.user_name,
      }),
    });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({
      message: "Internal erver error",
    });
  }
});

module.exports = router;
