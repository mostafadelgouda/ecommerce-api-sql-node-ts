import { type Response, Router } from "express";
import passport from 'passport';
import { login, signup } from "../controllers/users.js"
import jwt from "jsonwebtoken";

const router = Router();
// router.route("/")
//     //.all(isAdmin)
//     .get()

router.get(
    "/auth/login",
    login
);
router.get(
    "/auth/signup",
    signup
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

