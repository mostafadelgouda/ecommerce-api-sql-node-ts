import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuth.js";
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cart.js";

const router = Router();

router.post("/", isAuthenticated, addToCart);
router.get("/", isAuthenticated, getCart);
router.put("/:id", isAuthenticated, updateCartItem);
router.delete("/:id", isAuthenticated, removeCartItem);
router.delete("/", isAuthenticated, clearCart);

export default router;
