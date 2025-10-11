import { Router } from "express";
import {
    createReview,
    deleteReview,
    updateReview,
    getProductReviews,
} from "../controllers/reviews.js";
import { isAuthenticated } from "../middlewares/isAuth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { createReviewValidator } from "../validators/reviewValidators.js";
import { attachUserFromToken } from "../middlewares/attachUserFromToken.js";

const router = Router();

router.post(
    "/:product_id",
    isAuthenticated,
    createReviewValidator,
    validateRequest,
    createReview
);

router.get("/:product_id", attachUserFromToken, getProductReviews);

router.put("/:review_id", isAuthenticated, updateReview);

router.delete("/:review_id", isAuthenticated, deleteReview);

export default router;
