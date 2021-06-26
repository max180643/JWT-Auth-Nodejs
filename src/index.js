import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const {
  PORT,
  JWT_ACCESS_SECRET,
  JWT_ACCESS_TIME,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_TIME,
} = process.env;

const app = express();

// Middlewares
app.use(express.json());

let refreshTokens = [];

// Custom middleware
const verifyToken = (req, res, next) => {
  try {
    // token = "Bearer tokenString"
    const token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "Your session is not valid.",
      data: error,
    });
  }
};

const verifyRefreshToken = (req, res, next) => {
  const token = req.body.token;

  if (token === null) {
    return res.status(401).json({
      status: false,
      message: "Invalid request.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    req.userData = decoded;

    // verify if token is in store or not
    let storedRefreshToken = refreshTokens.find(
      (x) => x.username === decoded.sub
    );
    if (storedRefreshToken === undefined) {
      return res.status(401).json({
        status: false,
        message: "Invalid request. Token is not in store.",
      });
    }
    if (storedRefreshToken.token !== token) {
      return res.status(401).json({
        status: false,
        message: "Invalid request. Token is not same in store.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: true,
      message: "Your session is not valid.",
      data: error,
    });
  }
};

const generateRefreshToken = (username) => {
  const refresh_token = jwt.sign({ sub: username }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_TIME,
  });

  // save refresh token
  let storedRefreshToken = refreshTokens.find((x) => x.username === username);

  if (storedRefreshToken === undefined) {
    // add refresh token
    refreshTokens.push({
      username: username,
      token: refresh_token,
    });
  } else {
    // update refresh token
    refreshTokens[
      refreshTokens.findIndex((x) => x.username === username)
    ].token = refresh_token;
  }

  return refresh_token;
};

// Routes

// registration

// login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "demo" && password === "123456") {
    const access_token = jwt.sign({ sub: username }, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_TIME,
    });
    const refresh_token = generateRefreshToken(username);

    return res.status(200).json({
      status: true,
      message: "login success.",
      data: { access_token, refresh_token },
    });
  }

  return res.status(401).json({ status: true, message: "login fail." });
});

app.post("/token", verifyRefreshToken, (req, res) => {
  const username = req.userData.sub;
  const access_token = jwt.sign({ sub: username }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_TIME,
  });
  const refresh_token = generateRefreshToken(username);
  return res.status(200).json({
    status: true,
    message: "success",
    data: { access_token, refresh_token },
  });
});

// logout
app.get("/logout", verifyToken, (req, res) => {
  const username = req.userData.sub;

  // remove the refresh token
  refreshTokens = refreshTokens.filter((x) => x.username !== username);
  return res.status(200).json({
    status: true,
    message: "success.",
  });
});

// dashboard
app.get("/dashboard", verifyToken, (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Hello from dashboard.",
  });
});

app.listen(PORT, () => console.log(`Server running at port ${PORT}.`));
