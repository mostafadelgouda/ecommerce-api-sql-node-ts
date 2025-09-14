import { body, param } from "express-validator";

export const createReviewValidator = [
    param("product_id")
        .isInt({ gt: 0 })
        .withMessage("Product ID must be a positive integer"),

    body("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),

    body("comment")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Comment must be a string with max length 500"),
];
