// routes/paymentRoutes.ts
import { Router } from "express";
import { paymentSuccess } from "../controllers/payments.js";
import { isAuthenticated } from "../middlewares/isAuth.js";

const router = Router();

router.get("/success", isAuthenticated, paymentSuccess);

export default router;
