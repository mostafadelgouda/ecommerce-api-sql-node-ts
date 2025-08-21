import { Router } from "express";
import {
    createVariant, getVariantsByProduct,
    updateVariant, deleteVariant
} from "../controllers/product_variants.js";

import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/:productId/variants", isAdmin, createVariant);
router.get("/:productId/variants", getVariantsByProduct);
router.put("/variants/:id", isAdmin, updateVariant);
router.delete("/variants/:id", isAdmin, deleteVariant);

export default router;
