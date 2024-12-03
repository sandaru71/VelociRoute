const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const bodyParser = require("body-parser");


const app = express();

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "5mb",
    extended: true,
  })
);

app.get("/", (req, res, next) => {
    res.send("Hello World!");
  });

const port = process.env.APP_PORT;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
