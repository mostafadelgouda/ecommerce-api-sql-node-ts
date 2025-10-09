// validators/cartValidator.ts
import { body, param } from "express-validator";

export const validateAddToCart = [
    body("product_id")
        .optional()
        .isInt()
        .withMessage("Product ID must be a number"),

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