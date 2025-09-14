import { body, param } from "express-validator";

// ✅ Create Sale Item Validator
export const createSaleItemValidator = [
    body("product_id")
        .isInt({ gt: 0 })
        .withMessage("Product ID must be a positive integer"),

    body("discount_percent")
        .isFloat({ min: 0, max: 100 })
        .withMessage("Discount percent must be between 0 and 100"),

    body("start_date")
        .isISO8601()
        .withMessage("Start date must be a valid date (YYYY-MM-DD)"),

    body("end_date")
        .isISO8601()
        .withMessage("End date must be a valid date (YYYY-MM-DD)")
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.start_date)) {
                throw new Error("End date must be after start date");
            }
            return true;
        }),
];

// ✅ Update Sale Item Validator
export const updateSaleItemValidator = [
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Sale item ID must be a positive integer"),

    body("product_id")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("Product ID must be a positive integer"),

    body("discount_percent")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("Discount percent must be between 0 and 100"),

    body("start_date")
        .optional()
        .isISO8601()
        .withMessage("Start date must be a valid date (YYYY-MM-DD)"),

    body("end_date")
        .optional()
        .isISO8601()
        .withMessage("End date must be a valid date (YYYY-MM-DD)")
        .custom((value, { req }) => {
            if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
                throw new Error("End date must be after start date");
            }
            return true;
        }),
];
