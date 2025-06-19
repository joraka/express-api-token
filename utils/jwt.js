const jsonwebtoken = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  console.log("no jwt secret found");
  process.exit(1);
}

const generateToken = (payload, expiresIn = "1h") =>
  jsonwebtoken.sign(payload, process.env.JWT_SECRET, { expiresIn });

const verifyToken = (token) => jsonwebtoken.verify(token, process.env.JWT_SECRET);

module.exports = { generateToken, verifyToken };
