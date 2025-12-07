require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./src/config/db");

// import routes
const userRoutes = require("./src/routes/userRoutes");

const app = express();

connectDB();

app.use(helmet()); // Security headers
app.use(cors());
app.use(compression()); // Gzip compression
app.use(express.json()); // Parse JSON bodies

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Sajilo Hariyo API",
    status: "Running",
  });
});

// mount routes
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
