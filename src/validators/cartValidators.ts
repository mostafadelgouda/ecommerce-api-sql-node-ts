// validators/cartValidator.ts
import { body, param } from "express-validator";

export const validateAddToCart = [
    body("variant_id")
        .notEmpty()
        .withMessage("Variant ID is required")
        .isInt()
        .withMessage("Variant ID must be a number"),
    body("product_id")
        .optional()
        .isInt()
        .withMessage("Product ID must be a number"),
    body("quantity")
        .notEmpty()
        .withMessage("Quantity is required")
        .isInt({ min: 1 })
        .withMessage("Quantity must be a positive number"),
];

export const validateUpdateCartItem = [
    param("id").notEmpty().withMessage("Cart item ID is required"),
    body("quantity")
        .notEmpty()
        .withMessage("Quantity is required")
        .isInt({ min: 0 })
        .withMessage("Quantity must be 0 or greater"),
];

export const validateRemoveCartItem = [
    param("id").notEmpty().withMessage("Cart item ID is required"),
];