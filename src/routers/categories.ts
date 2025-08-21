import { Router } from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/categories.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

router.post("/", isAdmin, createCategory);       // only admin
router.get("/", getCategories);                 // public
router.get("/:id", getCategoryById);            // public
router.put("/:id", isAdmin, updateCategory);    // only admin
router.delete("/:id", isAdmin, deleteCategory); // only admin

export default router;