import { type Response, Router } from "express";
import { login, signup, getAdminDetails } from "../controllers/admins.js"
import { isAdmin } from "../middlewares/isAdmin.js";
import { loginValidator, signupValidator } from "../validators/adminAuthValidators.js"
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

//router.post("/admin/signup", signupValidator, validateRequest, signup);
router.post("/admin/login", loginValidator, validateRequest, login);
router.get(
    "/admin/getDetails",
    isAdmin,
    getAdminDetails
);
export default router;
