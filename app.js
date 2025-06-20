require("./config/env");
const express = require("express");
const app = express();
const port = 3131;
const { createDbTables } = require("./utils/dbinit");
const { syncTokenBlacklist } = require("./utils/jwt.js");

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.use("/v1/", require("./routes/userDetails.js"));
app.use("/v1/", require("./routes/createUser.js"));
app.use("/v1/", require("./routes/updateAllUserData.js"));
app.use("/v1/", require("./routes/updateUserDataField.js"));
app.use("/v1/", require("./routes/deleteUser.js"));
app.use("/v1/", require("./routes/login.js"));

//listen
createDbTables()
  .then(syncTokenBlacklist)
  .then(() => {
    app.listen(port, (err) => {
      if (err) return console.log(err);
      console.log(`listening at http://localhost:${port}`);
    });
  });
