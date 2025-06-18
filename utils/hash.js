const bcryptjs = require("bcryptjs");

const hashPass = async (password) => bcryptjs.hash(password, 10);

const compareHashPass = (plainPass, hashedPass) => bcryptjs.compare(plainPass, hashedPass);

module.exports = {
  hashPass,
  compareHashPass,
};
