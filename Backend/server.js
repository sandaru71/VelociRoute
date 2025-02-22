const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require('./src/Infrastructure/db');


const app = express();

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "5mb",
    extended: true,
  })
);

let db; // Store database instance

// Connect to MongoDB
connectDB().then(database => {
  db = database;
  console.log("🚀 Database Ready!");
}).catch(err => console.error(err));

app.get('/', (req, res) => {
  res.send("MongoDB Node.js Driver is running!");
});

const port = process.env.APP_PORT;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });