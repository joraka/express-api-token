const jsonwebtoken = require("jsonwebtoken");
const pgPool = require("../config/db");

if (!process.env.JWT_SECRET) {
  console.log("no jwt secret found");
  process.exit(1);
}

const tokenBlacklist = new Set();

const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

const generateToken = (payload, expiresIn = "1h") =>
  jsonwebtoken.sign(payload, process.env.JWT_SECRET, { expiresIn });

const verifyToken = (token) => jsonwebtoken.verify(token, process.env.JWT_SECRET);

const addTokenToBlacklist = async (token) => {
  try {
    const result = await pgPool.query(
      `INSERT INTO jwt_blacklist (jwt_token, expires_at) VALUES ($1, $2)`,
      [token, new Date(jsonwebtoken.decode(token).exp * 1000)]
    );

    if (result.rowCount > 0) {
      console.log("Token added to blacklist");
    } else {
      console.log("Token was not added to blacklist");
    }

    tokenBlacklist.add(token);
  } catch (err) {
    console.log("failed to add jwt token to blacklist", err);
  }
};

const syncTokenBlacklist = async () => {
  try {
    tokenBlacklist.clear();
    const result = await pgPool.query("SELECT jwt_token FROM jwt_blacklist");
    result.rows.forEach(({ jwt_token }) => tokenBlacklist.add(jwt_token));
    console.log(`${tokenBlacklist.size} tokens loaded to blacklist`);
  } catch (err) {
    console.log("failed loading token", err);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  syncTokenBlacklist,
  addTokenToBlacklist,
  isTokenBlacklisted,
};
