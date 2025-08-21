import { Router } from "express";
import {
    createProduct, getProducts, getProductById,
    updateProduct, deleteProduct
} from "../controllers/products.js";



import { isAdmin } from "../middlewares/isAdmin.js"; // middleware to check admin role

const router = Router();

// products
router.post("/", isAdmin, createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", isAdmin, updateProduct);
router.delete("/:id", isAdmin, deleteProduct);

export default router;
