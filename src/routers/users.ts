import { type Response, Router } from "express";
import { login, signup, getUserDetails, changePassword, forgotPassword, resetPassword, loginGoogle } from "../controllers/users.js"
import { isAuthenticated } from "../middlewares/isAuth.js";
import passport from "../config/passport.js";
const router = Router();
router.get(
    "/auth/login",
    login
);
router.get(
    "/auth/changePassword",
    isAuthenticated,
    changePassword
);
router.get(
    "/auth/signup",
    signup
);
router.get(
    "/auth/forgotPassword",
    forgotPassword
);
router.get(
    "/auth/resetPassword",
    resetPassword
);
router.get(
    "/getUserDetails",
    isAuthenticated,
    getUserDetails
);


router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);


router.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    loginGoogle
);



export default router;

