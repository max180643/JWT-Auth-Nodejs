import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

import auth_routes from "./routes/auth.route";
import user_routes from "./routes/user.route";

dotenv.config();
const { PORT, DB_CONNECT_STRING } = process.env;

mongoose.connect(
  DB_CONNECT_STRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB.");
  }
);

const app = express();

// Middlewares
app.use(express.json());

// Routes
app.use("/auth", auth_routes);
app.use("/user", user_routes);

app.listen(PORT, () => console.log(`Server running at port ${PORT}.`));
