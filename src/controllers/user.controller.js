import User from "../models/user.model";
import redis_client from "../redis_connect";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_TIME,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_TIME,
} = process.env;

export const Register = async (req, res) => {
  const { username, password } = req.body;

  const user = new User({
    username: username,
    password: password,
  });

  try {
    const saved_user = await user.save();
    res.status(200).json({
      status: true,
      message: "Registered successfully.",
      data: saved_user,
    });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: "Something went wrong.",
      data: error,
    });
  }
};

export const Login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({
      username: username,
      password: password,
    }).exec();

    if (user === null)
      res.status(401).json({
        status: false,
        message: "username or password is not valid.",
      });

    const access_token = jwt.sign({ sub: user._id }, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_TIME,
    });
    const refresh_token = generateRefreshToken(user._id);

    return res.status(200).json({
      status: true,
      message: "login success.",
      data: { access_token, refresh_token },
    });
  } catch (error) {
    return res
      .status(401)
      .json({ status: true, message: "login fail.", data: error });
  }
};

export const Logout = async (req, res) => {
  const user_id = req.userData.sub;
  const token = req.token;

  // remove the refresh token
  await redis_client.del(user_id.toString());

  // blacklist current access token
  // set expire in redis
  await redis_client.set(`BL_${user_id.toString()}`, token);

  return res.status(200).json({
    status: true,
    message: "success.",
  });
};

export const GetAccessToken = (req, res) => {
  const user_id = req.userData.sub;
  const access_token = jwt.sign({ sub: user_id }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_TIME,
  });
  const refresh_token = generateRefreshToken(user_id);

  return res.status(200).json({
    status: true,
    message: "success",
    data: { access_token, refresh_token },
  });
};

const generateRefreshToken = (user_id) => {
  const refresh_token = jwt.sign({ sub: user_id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_TIME,
  });

  redis_client.get(user_id.toString(), (err, data) => {
    if (err) throw err;

    redis_client.set(
      user_id.toString(),
      JSON.stringify({ token: refresh_token })
    );
  });

  return refresh_token;
};
