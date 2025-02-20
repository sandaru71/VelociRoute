const path = require('path');
const express = require("express");
require("dotenv/config");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
// Update this line to include 'src' in the path
const { connectDB } = require(path.join(__dirname, 'src', 'Infrastructure', 'db'));
const userRoutes = require("./src/Routes/userRoute");

const uploadRoutes = require("./src/Routes/uploadRoutes");


const app = express();

app.use(cors());
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

app.use("/api/users", userRoutes);
app.use("/api", uploadRoutes);

const port = process.env.APP_PORT;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});