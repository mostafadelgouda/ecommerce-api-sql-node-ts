import { body, param, query } from "express-validator";

// ✅ Create category validator
export const createCategoryValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),

    body("description")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),

    body("image_url")
        .optional()
        .isURL()
        .withMessage("Image URL must be a valid URL"),
];

// ✅ Update category validator
export const updateCategoryValidator = [
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Category ID must be a positive integer"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),

    body("description")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),

    body("image_url")
        .optional()
        .isURL()
        .withMessage("Image URL must be a valid URL"),
];

// ✅ Get/Delete category validator (ID param)
export const categoryIdValidator = [
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Category ID must be a positive integer"),
];

// ✅ Pagination validator for getCategories
export const getCategoriesValidator = [
    query("page")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ gt: 0, lt: 101 })
        .withMessage("Limit must be between 1 and 100"),
];
