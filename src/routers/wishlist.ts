import express from "express";
import { addToWishlist, getWishlist, removeFromWishlist, clearWishlist } from "../controllers/wishlist.js";
import { isAuthenticated } from "../middlewares/isAuth.js"; "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuthenticated, addToWishlist);
router.get("/", isAuthenticated, getWishlist);
router.delete("/:product_id", isAuthenticated, removeFromWishlist);
router.delete("/", isAuthenticated, clearWishlist);

export default router;