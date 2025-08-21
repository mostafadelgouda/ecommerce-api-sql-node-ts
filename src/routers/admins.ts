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


// const router =
//     // Google login route
//     app.get('/auth/google',
//         passport.authenticate('google', { scope: ['profile', 'email'] })
//     );

// // Callback route
// app.get('/auth/google/callback',
//     passport.authenticate('google', { failureRedirect: '/' }),
//     (req, res) => {
//         // Issue JWT
//         const token = jwt.sign({ id: req.user.id, email: req.user.email }, 'SECRET_KEY');
//         res.json({ token });
//     }
// );
