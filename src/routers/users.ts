import { type Response, Router } from "express";
import passport from 'passport';
import { login, signup, getUserDetails, changePassword, forgotPassword, resetPassword } from "../controllers/users.js"
import jwt from "jsonwebtoken";
import { isAuthenticated } from "../middlewares/isAuth.js";

const router = Router();
// router.route("/")
//     //.all(isAdmin)
//     .get()

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

// Google callback
router.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    (req, res) => {
        const user = req.user as any;
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1d" }
        );
        res.json({ user, token });
    }
);



export default router;

