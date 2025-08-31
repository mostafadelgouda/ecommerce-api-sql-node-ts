import { type Response, Router } from "express";
import { login, signup } from "../controllers/admins.js"

const router = Router();

router.post(
    "/admin/login",
    login
);
router.post(
    "/admin/signup",
    signup
);

export default router;
