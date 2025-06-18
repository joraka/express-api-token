require("dotenv").config();

const requiredEnvKeys = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PORT", "JWT_SECRET", "DB_PASSWORD"];

requiredEnvKeys.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing key from .env: ${key}`);
  }
});

module.exports = process.env;