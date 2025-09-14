import { body, param } from "express-validator";

// ✅ Add to Wishlist Validator
export const addToWishlistValidator = [
    body("product_id")
        .notEmpty()
        .withMessage("Product ID is required")
        .isInt({ gt: 0 })
        .withMessage("Product ID must be a positive integer"),
];

// ✅ Remove from Wishlist Validator
export const removeFromWishlistValidator = [
    param("product_id")
        .notEmpty()
        .withMessage("Product ID is required")
        .isInt({ gt: 0 })
        .withMessage("Product ID must be a positive integer"),
];
