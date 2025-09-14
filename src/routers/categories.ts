import { Router } from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/categories.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { createCategoryValidator, updateCategoryValidator, categoryIdValidator, getCategoriesValidator } from "../validators/categoryValidators.js";

const router = Router();
router.post("/", createCategoryValidator, isAdmin, validateRequest, createCategory);
router.get("/", getCategoriesValidator, validateRequest, getCategories);
router.get("/:id", categoryIdValidator, validateRequest, getCategoryById);
router.put("/:id", updateCategoryValidator, isAdmin, validateRequest, updateCategory);
router.delete("/:id", categoryIdValidator, isAdmin, validateRequest, deleteCategory);

export default router;