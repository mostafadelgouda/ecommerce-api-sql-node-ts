import express from "express";
import {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    clearWishlist,
} from "../controllers/wishlist.js";
import { isAuthenticated } from "../middlewares/isAuth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    addToWishlistValidator,
    removeFromWishlistValidator,
} from "../validators/wishlistValidators.js";

const router = express.Router();

router.post(
    "/",
    isAuthenticated,
    addToWishlistValidator,
    validateRequest,
    addToWishlist
);

router.get("/", isAuthenticated, getWishlist);

router.delete(
    "/:product_id",
    isAuthenticated,
    removeFromWishlistValidator,
    validateRequest,
    removeFromWishlist
);

router.delete("/", isAuthenticated, clearWishlist);

export default router;
