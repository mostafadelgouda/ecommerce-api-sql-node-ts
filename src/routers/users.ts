import { type Response, Router } from "express";
import {
    login,
    signup,
    getUserDetails,
    changePassword,
    forgotPassword,
    resetPassword,
    loginGoogle
} from "../controllers/users.js";
import { isAuthenticated } from "../middlewares/isAuth.js";
import passport from "../config/passport.js";
import { validateRequest } from "../middlewares/validateRequest.js";

import {
    signupValidator,
    loginValidator,
    changePasswordValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} from "../validators/userValidators.js";

const router = Router();

router.post("/auth/login", loginValidator, validateRequest, login);
router.post("/auth/signup", signupValidator, validateRequest, signup);
router.post("/auth/changePassword", isAuthenticated, changePasswordValidator, validateRequest, changePassword);
router.post("/auth/forgotPassword", forgotPasswordValidator, validateRequest, forgotPassword);
router.post("/auth/resetPassword", resetPasswordValidator, validateRequest, resetPassword);

router.get("/getUserDetails", isAuthenticated, getUserDetails);

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    loginGoogle
);

export default router;
