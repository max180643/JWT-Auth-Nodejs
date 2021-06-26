import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";

const route = Router();

route.get("/dashboard", verifyToken, (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Hello from dashboard.",
  });
});

export default route;
