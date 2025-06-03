const express = require("express");
const app = express();
const port = 3131;

app.use(express.json());

const db = {
  max_id: 0,
  users: [],
};

const validator = {
  isValidId: (res, id) => {
    if (!id || !isFinite(id)) {
      res.status(400).json({ message: "ID invalid or missing" });
      return false;
    }

    return true;
  },
  
  isRegistrationDataValid: (res, username, email, password) => {
    if (!username || !email || !password) {
      res
        .status(400)
        .json({ message: "Missing field. Username, email and password are required." });
      return false;
    }

    return true;
  },

  isValidUsername: (res, username) => {
    if (username.length < 2 || username > 32) {
      res.status(400).json({ message: "Username length must be between 2 and 32" });
      return false;
    }

    const foundUsername = db.users.findIndex((user) => user.username === username);

    if (foundUsername !== -1) {
      res.status(400).json({ message: "Username already exists" });
      return false;
    }

    return true;
  },

  isValidEmail: (res, email) => {
    const foundEmail = db.users.findIndex((user) => user.email === email);

    if (foundEmail !== -1) {
      res.status(400).json({ message: "Email already exists" });
      return false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      res.status(400).json({ message: "Invalid email address" });
      return false;
    }

    return true;
  },

  isValidPassword: (res, password) => {
    if (password.length < 2 || password > 32) {
      res.status(400).json({ message: "Password length must be between 2 and 32" });
      return false;
    }

    for (let i = 0; i < password.length; i++) {
      const code = password.charCodeAt(i);
      if (
        (code < 48 || code > 57) && // 0-9
        (code < 65 || code > 90) && // A-Z
        (code < 97 || code > 122) // a-z
      ) {
        res.status(400).json({
          message: "Invalid character entered, must be alphabetical and numerical letters",
        });
        return false;
      }
    }

    return true;
  },
};

app.get("/v1/", (req, res) => {
  res.status(200).send("hi");
});

app.get("/v1/users", (req, res) => {
  res.status(200).json(db.users);
});

app.get("/v1/users/:id", (req, res) => {
  const { id } = req.params;

  if (!validator.isValidId(res, id)) return;

  const foundIndex = db.users.findIndex((user) => user.id === parseInt(id));

  if (foundIndex === -1) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.status(200).json({
    message: "User found",
    user: db.users[foundIndex],
  });
});

//post methods
app.post("/v1/users", (req, res) => {
  let { username, email, password } = req.body;

  if (!validator.isRegistrationDataValid(res, username, email, password)) return;

  username = username.trim();

  //unique username validation
  //username length validation 3 to 35
  if (!validator.isValidUsername(res, username)) return;

  //email validation unique
  //email format validation
  if (!validator.isValidEmail(res, email)) return;

  //possword validation - length 8 to 32,
  //password validation - only numbers and alphabetical characters
  if (!validator.isValidPassword(res, password)) return;

  const user = {
    id: ++db.max_id,
    username: username,
    email: email,
    password: password,
  };

  db.users.push(user);

  res.json({
    message: "User created",
    user,
  });
});

// put methods
app.put("/v1/users/:id", (req, res) => {
  let { username, email, password } = req.body;
  let { id } = req.params;

  if (!validator.isValidId(res, id)) return;
  if (!validator.isRegistrationDataValid(res, username, email, password)) return;

  const foundUserIndex = db.users.findIndex((user) => user.id === parseInt(id));

  if (foundUserIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  username = username.trim();

  //unique username validation
  //username length validation 3 to 35
  if (!validator.isValidUsername(res, username)) return;

  //email validation unique
  //email format validation
  if (!validator.isValidEmail(res, email)) return;

  //possword validation - length 8 to 32,
  //password validation - only numbers and alphabetical characters
  if (!validator.isValidPassword(res, password)) return;

  const foundUserObject = db.users[foundUserIndex];

  foundUserObject.username = username;
  foundUserObject.email = email;
  foundUserObject.password = password;

  res.json({
    message: "User updated",
    user: foundUserObject,
  });
});

// patch methods
app.patch("/v1/users/:id", (req, res) => {
  let { username, email, password } = req.body;
  let { id } = req.params;

  if (!validator.isValidId(res, id)) return;

  const foundUserIndex = db.users.findIndex((user) => user.id === parseInt(id));

  if (foundUserIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!username && !email && !password) {
    return res.status(400).json({
      message: "Must have at least one field, allowed fields are: username, email, password",
    });
  }

  //unique username validation
  //username length validation 3 to 35
  if (username) {
    username = username.trim();
    if (!validator.isValidUsername(res, username)) return;
  }

  //email validation unique
  //email format validation
  if (email && !validator.isValidEmail(res, email)) return;

  //possword validation - length 8 to 32,
  //password validation - only numbers and alphabetical characters
  if (password && !validator.isValidPassword(res, password)) return;

  const foundUserObject = db.users[foundUserIndex];

  if (username) foundUserObject.username = username;
  if (email) foundUserObject.email = email;
  if (password) foundUserObject.password = password;

  res.json({
    message: "User updated",
    user: foundUserObject,
  });
});

// delete methods
//user id validation
app.delete("/v1/users/:id", (req, res) => {
  let { id } = req.params;

  if (!validator.isValidId(res, id)) return;

  const foundUserIndex = db.users.findIndex((user) => user.id === parseInt(id));

  if (foundUserIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users.splice(foundUserIndex, 1);

  res.json({
    message: "User deleted",
  });
});

app.listen(port, (err) => {
  if (err) return console.log(err);
  console.log(`listening at http://localhost:${port}`);
});
