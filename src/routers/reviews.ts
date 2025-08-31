import { Router } from "express";
import {
    createReview, deleteReview, updateReview, getProductReviews
} from "../controllers/reviews.js";
import { isAuthenticated } from "../middlewares/isAuth.js";
const router = Router();


router.post("/:product_id", isAuthenticated, createReview);
router.get("/:product_id", getProductReviews);
router.put("/:review_id", isAuthenticated, updateReview);
router.delete("/:review_id", isAuthenticated, deleteReview);

export default router;
