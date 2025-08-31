import { Router } from "express";
import {
    createProduct, getProducts, getProductById,
    updateProduct, deleteProduct, addProductImage, getProductImages, deleteProductImage
} from "../controllers/products.js";



import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/", isAdmin, createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", isAdmin, updateProduct);
router.delete("/:id", isAdmin, deleteProduct);

router.post("/:product_id/images", isAdmin, addProductImage);
router.get("/:product_id/images", getProductImages);
router.delete("/images/:image_id", isAdmin, deleteProductImage);
export default router;
