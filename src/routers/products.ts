import { Router } from "express";
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addProductImage,
    getProductImages,
    deleteProductImage,
} from "../controllers/products.js";

import { validateRequest } from "../middlewares/validateRequest.js";
import { isAdmin } from "../middlewares/isAdmin.js";

import {
    createProductValidator,
    updateProductValidator,
    addProductImageValidator,
    productIdParamValidator,
    productImageIdParamValidator,
} from "../validators/productValidators.js";

const router = Router();

router.post("/", isAdmin, createProductValidator, validateRequest, createProduct);
router.get("/", getProducts);
router.get("/:id", productIdParamValidator, validateRequest, getProductById);
router.put("/:id", isAdmin, updateProductValidator, validateRequest, updateProduct);
router.delete("/:id", isAdmin, productIdParamValidator, validateRequest, deleteProduct);

router.post("/:product_id/images", isAdmin, addProductImageValidator, validateRequest, addProductImage);
router.get("/:product_id/images", productIdParamValidator, validateRequest, getProductImages);
router.delete("/images/:image_id", isAdmin, productImageIdParamValidator, validateRequest, deleteProductImage);

export default router;
