const jwt = require("./jwt");

const authentificate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")?.[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized (invalid token)",
      });
    }

    if (jwt.isTokenBlacklisted(token)) {
      return res.status(401).json({
        message: "Unauthorized (token expired/removed)",
      });
    }

    try {
      req.user = jwt.verifyToken(token);
      req.user.token = token;
      return next();
    } catch (jwtErr) {
      return res.status(401).json({
        message: `Unauthorized (${
          jwtErr.name === "TokenExpiredError" ? "token expired" : "bad token"
        })`,
      });
    }
  } catch (err) {
    console.error("authMiddleware error", err);
    return res.status(500).json({
      message: "Internal server error (auth)",
    });
  }
};

module.exports = { authentificate };
