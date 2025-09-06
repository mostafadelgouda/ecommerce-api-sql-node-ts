import { type Response, Router } from "express";
import { login, signup, getAdminDetails } from "../controllers/admins.js"
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post(
    "/admin/login",
    login
);
router.post(
    "/admin/signup",
    signup
);
router.post(
    "/admin/getDetails",
    isAdmin,
    getAdminDetails
);
export default router;
