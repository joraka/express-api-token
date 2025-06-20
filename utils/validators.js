const pgPool = require("../config/db");

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

  isUsernameExists: async (username, user_id) => {
    let result;

    if (user_id) {
      result = await pgPool.query(
        `
        SELECT 1
        FROM users
        WHERE user_name = $1 AND user_id != $2
    `,
        [username, user_id]
      );
    } else {
      result = await pgPool.query(
        `
        SELECT 1
        FROM users
        WHERE user_name = $1
    `,
        [username]
      );
    }

    return result.rowCount > 0;
  },

  isValidUsername: (username) => {
    return username.length >= 3 && username.length <= 32;
  },

  isEmailExists: async (email, user_id) => {
    let result;
    if (user_id) {
      result = await pgPool.query(
        `
            SELECT 1 
            FROM users 
            WHERE email = $1 AND user_id != $2
        `,
        [email, user_id]
      );
    } else {
      result = await pgPool.query(
        `
            SELECT 1
            FROM users
            WHERE email = $1
        `,
        [email]
      );
    }

    return result.rowCount > 0;
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

module.exports = validator;
