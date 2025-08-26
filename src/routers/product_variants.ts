import { Router } from "express";
import {
    createVariant, getVariantsByProduct,
    updateVariant, deleteVariant, addVariantImage, deleteVariantImage, getVariantImages
} from "../controllers/product_variants.js";

import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/:productId/variants", isAdmin, createVariant);
router.get("/:productId/variants", getVariantsByProduct);
router.put("/variants/:id", isAdmin, updateVariant);
router.delete("/variants/:id", isAdmin, deleteVariant);

router.post("/variants/:variant_id/images", isAdmin, addVariantImage);
router.get("/variants/:variant_id/images", getVariantImages);
router.delete("/variants/images/:image_id", isAdmin, deleteVariantImage);

export default router;
