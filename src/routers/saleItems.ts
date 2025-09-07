import { Router } from "express";
import {
    createSaleItem, deleteSaleItem, getSaleItemById, getSaleItems, updateSaleItem
} from "../controllers/saleItems.js";



import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/", isAdmin, createSaleItem);
router.get("/", getSaleItems);
router.get("/:id", getSaleItemById);
router.put("/:id", isAdmin, updateSaleItem);
router.delete("/:id", isAdmin, deleteSaleItem);

export default router;
