const express = require("express");
const pgPool = require("../config/db");
const { authentificate } = require("../utils/authMiddleware");
const validator = require("../utils/validators");
const { hashPass } = require("../utils/hash");

const router = express.Router();

router.patch("/user", authentificate, async (req, res) => {
  try {
    let { username, email, password } = req?.body || {};

    const updateObj = {
      query: [],
      data: [],
    };

    if (!validator.isSomeFieldsExist([username, email, password])) {
      return res.status(400).json({
        message: "Must have at least one field, allowed fields are: username, email, password",
      });
    }

    //unique username validation
    //username length validation 3 to 35
    if (username) {
      username = username.trim();

      if (!validator.isValidUsername(username)) {
        return res.status(400).json({ message: "Username length must be between 3 and 32" });
      }

      if (await validator.isUsernameExists(username, req.user.id)) {
        return res.status(400).json({ message: "Username already exists" });
      }

      updateObj.query.push("user_name = $" + (updateObj.query.length + 1));
      updateObj.data.push(username);
    }

    //email validation unique
    //email format validation
    if (email) {
      if (!validator.isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      if (await validator.isEmailExists(email, req.user.id)) {
        return res.status(400).json({ message: "Email already exists" });
      }

      updateObj.query.push("email = $" + (updateObj.query.length + 1));
      updateObj.data.push(email);
    }

    //possword validation - length 8 to 32,
    //password validation - only numbers and alphabetical characters
    if (password) {
      if (!validator.isValidPassword(password)) {
        return res.status(400).json({
          message:
            "Password must be in numerical and alphabetical characters, length must be between 3 and 32 characters",
        });
      }

      updateObj.query.push("password = $" + (updateObj.query.length + 1));
      updateObj.data.push(await hashPass(password));
    }

    console.log(
      updateObj,
      `
        UPDATE users
        SET ${updateObj.query.join(",")}
        WHERE user_id = $${updateObj.query.length + 1}
        RETURNING *
        `
    );

    const result = await pgPool.query(
      `
        UPDATE users
        SET ${updateObj.query.join(",")}
        WHERE user_id = $${updateObj.query.length + 1}
        RETURNING *
        `,
      [...updateObj.data, req.user.id]
    );

    const user = result.rows?.[0];

    if (updateObj.query.length > 0) {
      res.status(200).json({
        message: "Data updated",
        user: {
          id: user.user_id,
          username: user.user_name,
          email: user.email,
        },
      });
    } else {
      res.status(200).json({
        message: "Nothing to update",
      });
    }
  } catch (err) {
    console.error("update some data error", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
