//Third-party
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

//Own Modules
const app = require("./app");

//Database
const DB = process.env.DB_SERVER.replace("<PASSWORD>", process.env.DB_PASSWORD);

//Mongoose Connection
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));

//Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log("Hey there from port 3k");
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
