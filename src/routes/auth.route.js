import { Router } from "express";
import {
  Register,
  Login,
  Logout,
  GetAccessToken,
} from "../controllers/user.controller";
import {
  verifyRefreshToken,
  verifyToken,
} from "../middlewares/auth.middleware";

const route = Router();

route.post("/register", Register);
route.post("/login", Login);
route.post("/token", verifyRefreshToken, GetAccessToken);
route.get("/logout", verifyToken, Logout);

export default route;
