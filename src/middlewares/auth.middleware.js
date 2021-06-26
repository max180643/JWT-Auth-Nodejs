import jwt from "jsonwebtoken";
import redis_client from "../redis_connect";
import dotenv from "dotenv";

dotenv.config();
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = process.env;

export const verifyToken = (req, res, next) => {
  try {
    // token = "Bearer tokenString"
    const token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.userData = decoded;
    req.token = token;

    // verify blacklisted access token.
    // set expire in redis
    redis_client.get(`BL_${decoded.sub.toString()}`, (err, data) => {
      if (err) throw err;

      if (data === token)
        return res.status(401).json({
          status: false,
          message: "Blacklisted token.",
          data: error,
        });

      next();
    });
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "Your session is not valid.",
      data: error,
    });
  }
};

export const verifyRefreshToken = (req, res, next) => {
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
    redis_client.get(decoded.sub.toString(), (err, data) => {
      if (err) {
        throw err;
      }

      if (data === null)
        return res.status(401).json({
          status: false,
          message: "Invalid request. Token is not in store.",
        });

      if (JSON.parse(data).token !== token) {
        return res.status(401).json({
          status: false,
          message: "Invalid request. Token is not same in store.",
        });
      }

      next();
    });
  } catch (error) {
    return res.status(401).json({
      status: true,
      message: "Your session is not valid.",
      data: error,
    });
  }
};
