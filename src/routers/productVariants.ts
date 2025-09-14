import { Router } from "express";
import {
    createVariant,
    getVariantsByProduct,
    updateVariant,
    deleteVariant,
    addVariantImage,
    getVariantImages,
    deleteVariantImage,
} from "../controllers/productVariants.js";

import { isAdmin } from "../middlewares/isAdmin.js";
import { validateRequest } from "../middlewares/validateRequest.js";

import {
    createVariantValidator,
    updateVariantValidator,
    addVariantImageValidator,
    productIdParamValidator,
    variantIdParamValidator,
    variantImageIdParamValidator,
} from "../validators/variantValidators.js";

const router = Router();

router.post("/:productId/variants", isAdmin, createVariantValidator, validateRequest, createVariant);
router.get("/:productId/variants", productIdParamValidator, validateRequest, getVariantsByProduct);
router.put("/variants/:id", isAdmin, updateVariantValidator, validateRequest, updateVariant);
router.delete("/variants/:id", isAdmin, variantIdParamValidator, validateRequest, deleteVariant);

router.post("/variants/:variant_id/images", isAdmin, addVariantImageValidator, validateRequest, addVariantImage);
router.get("/variants/:variant_id/images", variantIdParamValidator, validateRequest, getVariantImages);
router.delete("/variants/images/:image_id", isAdmin, variantImageIdParamValidator, validateRequest, deleteVariantImage);

export default router;
