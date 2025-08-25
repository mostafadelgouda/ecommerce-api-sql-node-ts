import express from "express";
import { addToWishlist, getWishlist, removeFromWishlist, clearWishlist } from "../controllers/wishlist.js";
import { isAuthenticated } from "../middlewares/isAuth.js"; "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuthenticated, addToWishlist); // add item
router.get("/", isAuthenticated, getWishlist); // get all items
router.delete("/:product_id", isAuthenticated, removeFromWishlist); // remove item
router.delete("/", isAuthenticated, clearWishlist); // remove item

export default router;