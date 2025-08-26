import { Router } from "express";
import {
    createReview, deleteReview, updateReview, getProductReviews
} from "../controllers/reviews.js";
import { isAdmin } from "../middlewares/isAdmin.js"; // middleware to check admin role
import { isAuthenticated } from "../middlewares/isAuth.js";
const router = Router();

// products
router.post("/:product_id", isAuthenticated, createReview);
router.get("/:product_id", getProductReviews);
router.put("/:review_id", isAuthenticated, updateReview);
router.delete("/:review_id", isAuthenticated, deleteReview);

export default router;
