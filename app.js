const express = require("express");
const dotenv = require("dotenv");
//const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
//app.use(cookieParser());
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Replace with your frontend address
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/", (req, res) => {
  console.log("server on home page");
  res.status(200).send("Welcome to home page");
});
