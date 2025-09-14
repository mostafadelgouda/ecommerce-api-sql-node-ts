import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuth.js";
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cart.js";
import { validateAddToCart, validateUpdateCartItem, validateRemoveCartItem } from "../validators/cartValidators.js"
import { validateRequest } from "../middlewares/validateRequest.js";
const router = Router();

router.post("/", isAuthenticated, validateAddToCart, validateRequest, addToCart);
router.get("/", isAuthenticated, getCart);
router.put("/:id", isAuthenticated, validateUpdateCartItem, validateRequest, updateCartItem);
router.delete("/:id", isAuthenticated, validateRemoveCartItem, validateRequest, removeCartItem);
router.delete("/", isAuthenticated, clearCart);

export default router;
