const express = require("express");
const app = express();
const port = 3131;

require("./config/env");

const pgPool = require("./config/db");
const createUserTable = require("./utils/dbinit");
const { hashPass, compareHashPass } = require("./utils/hash");

app.use(express.json());

const db = {
  max_id: 0,
  users: [],
};

const getUserData = (userObj) => {
  const filteredObj = { ...userObj };
  delete filteredObj.password;
  return filteredObj;
};

const validator = {
  isValidId: (id) => {
    if (typeof id !== "number") throw new Error("ID must be a number");
    return isFinite(id) && id >= 1;
  },

  isAllFieldExists: (fields) => {
    return fields.every(Boolean);
  },

  isSomeFieldsExist: (fields) => {
    return fields.some(Boolean);
  },

  isUsernameExits: (username, id) => {
    if (typeof username !== "string") throw new Error("username must be a string");
    if (id) {
      if (typeof id !== "number") throw new Error("ID must be a number");
      return db.users.some((user) => user.username === username && user.id !== id);
    }
    return db.users.some((user) => user.username === username);
  },

  isValidUsername: (username) => {
    return username.length >= 3 && username.length <= 32;
  },

  isEmailExists: (email, id) => {
    if (typeof email !== "string") throw new Error("Email must be a string");
    if (id) {
      if (typeof id !== "number") throw new Error("ID must be a number");
      return db.users.some((user) => user.email === email && user.id !== id);
    }
    return db.users.some((user) => user.email === email);
  },

  isValidEmail: (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  },

  isValidPassword: (password) => {
    if (password.length < 2 || password.length > 32) return false;

    let hasLetters = false;
    let hasNumbers = false;

    for (let i = 0; i < password.length; i++) {
      const code = password.charCodeAt(i);

      if (code >= 48 && code <= 57) {
        // 0-9
        hasNumbers = true;
      } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        // A-Z, a-z
        hasLetters = true;
      } else {
        return false;
      }
    }

    if (!hasLetters || !hasNumbers) return false;
    return true;
  },
};

app.get("/", (req, res) => {
  res.status(400).send("OK");
});

app.get("/insert", async (req, res) => {
  await createUserTable();
  res.status(400).send("inserted");
});

app.get("/v1/", (req, res) => {
  res.status(200).send("hi");
});

app.get("/v1/users", (req, res) => {
  res.status(200).json(db.users.map(getUserData));
});

app.get("/v1/users/:id", (req, res) => {
  const idNum = parseInt(req.params?.id, 10);

  if (!validator.isValidId(idNum)) {
    return res.status(400).json({ message: "Invalid or missing ID" });
  }

  const userObj = db.users.find((user) => user.id === idNum);

  if (!userObj) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    message: "User found",
    user: getUserData(userObj),
  });
});

//post methods
app.post("/v1/users", async (req, res) => {
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

  if (validator.isUsernameExits(username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  //email validation unique
  //email format validation
  if (!validator.isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (validator.isEmailExists(email)) {
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
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// put methods
app.put("/v1/users/:id", (req, res) => {
  let { username, email, password } = req?.body || {};
  const idNum = parseInt(req.params?.id, 10);

  if (!validator.isValidId(idNum)) {
    return res.status(400).json({ message: "Invalid or missing ID" });
  }

  if (!validator.isAllFieldExists([username, email, password])) {
    return res
      .status(400)
      .json({ message: "Missing field. Username, email and password are required." });
  }

  const userObj = db.users.find((user) => user.id === idNum);

  if (!userObj) {
    return res.status(404).json({ message: "User not found" });
  }

  username = username.trim();

  //unique username validation
  //username length validation 3 to 35
  if (!validator.isValidUsername(username)) {
    return res.status(400).json({ message: "Username length must be between 3 and 32" });
  }

  if (validator.isUsernameExits(username, idNum)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  //email validation unique
  //email format validation
  if (!validator.isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (validator.isEmailExists(email, idNum)) {
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

  userObj.username = username;
  userObj.email = email;
  userObj.password = password;

  res.json({
    message: "User updated",
    user: getUserData(userObj),
  });
});

// patch methods
app.patch("/v1/users/:id", (req, res) => {
  let { username, email, password } = req?.body || {};
  const idNum = parseInt(req.params?.id, 10);

  if (!validator.isValidId(idNum)) {
    return res.status(400).json({ message: "Invalid or missing ID" });
  }

  const user = db.users.find((user) => user.id === idNum);

  const updateObj = {};

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

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
    if (validator.isUsernameExits(username, idNum)) {
      return res.status(400).json({ message: "Username already exists" });
    }
    updateObj.username = username;
  }

  //email validation unique
  //email format validation
  if (email) {
    if (!validator.isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (validator.isEmailExists(email, idNum)) {
      return res.status(400).json({ message: "Email already exists" });
    }
    updateObj.email = email;
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
    updateObj.password = password;
  }

  Object.assign(user, updateObj);

  res.json({
    message: "User updated",
    user: getUserData(user),
  });
});

// delete methods
app.delete("/v1/users/:id", (req, res) => {
  //user id validation
  const idNum = parseInt(req.params?.id, 10);

  if (!validator.isValidId(idNum)) {
    return res.status(400).json({ message: "Invalid or missing ID" });
  }

  const userIndex = db.users.findIndex((user) => user.id === idNum);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users.splice(userIndex, 1);

  res.json({
    message: "User deleted",
  });
});

//login
app.get("/v1/login", async (req, res) => {
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
        message: "User not found",
      });
    }

    const dbUser = result.rows[0];

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
      },
      token: `${Date.now()}-${parseInt(Math.random() * 1e13)}`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

app.listen(port, (err) => {
  if (err) return console.log(err);
  console.log(`listening at http://localhost:${port}`);
});
