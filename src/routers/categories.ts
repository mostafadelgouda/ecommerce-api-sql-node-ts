import { Router } from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/categories.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/", isAdmin, createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", isAdmin, updateCategory);
router.delete("/:id", isAdmin, deleteCategory);

export default router;