import { Router } from "express";
import {
    createSaleItem,
    deleteSaleItem,
    getSaleItemById,
    getSaleItems,
    updateSaleItem,
} from "../controllers/saleItems.js";

import { validateRequest } from "../middlewares/validateRequest.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
    createSaleItemValidator,
    updateSaleItemValidator,
} from "../validators/saleItemValidators.js";

const router = Router();

router.post("/", isAdmin, createSaleItemValidator, validateRequest, createSaleItem);
router.get("/", getSaleItems);
router.get("/:id", getSaleItemById);
router.put("/:id", isAdmin, updateSaleItemValidator, validateRequest, updateSaleItem);
router.delete("/:id", isAdmin, deleteSaleItem);

export default router;
