const pool = require("../config/db");

const createUserTable = async () => {
  const query = `
          CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            user_name VARCHAR(35) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `;

  try {
    const result = await pool.query(query);
    console.log("User table created if not exists");
    return result;
  } catch (err) {
    console.error("Error creating user table", err);
    process.exit(1);
  }
};

const createTokenBlacklistTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS jwt_blacklist (
      jwt_token TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL
    );
  `;
  try {
    const result = await pool.query(query);
    console.log("Token blacklist table created");
    return result;
  } catch (err) {
    console.error("Error creating blacklist table", err);
    throw err;
  }
};

const createDbTables = () => Promise.all([createUserTable(), createTokenBlacklistTable()]);

module.exports = { createTokenBlacklistTable, createUserTable, createDbTables };
