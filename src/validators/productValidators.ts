import { body, param } from "express-validator";

export const createProductValidator = [
    body("name")
        .notEmpty().withMessage("Name is required")
        .isString().withMessage("Name must be a string"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("price")
        .notEmpty().withMessage("Price is required")
        .isFloat({ gt: 0 }).withMessage("Price must be a positive number"),

    body("category_id")
        .optional()
        .isInt().withMessage("Category ID must be an integer"),

    body("brand")
        .optional()
        .isString().withMessage("Brand must be a string"),

    body("images")
        .optional()
        .isArray().withMessage("Images must be an array"),

    body("images.*.image_url")
        .optional()
        .isURL().withMessage("Image URL must be valid"),

    body("images.*.is_main")
        .optional()
        .isBoolean().withMessage("is_main must be a boolean"),
];

export const updateProductValidator = [
    param("id").isInt().withMessage("Product ID must be an integer"),

    body("name")
        .optional()
        .isString().withMessage("Name must be a string"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("price")
        .optional()
        .isFloat({ gt: 0 }).withMessage("Price must be a positive number"),

    body("category_id")
        .optional()
        .isInt().withMessage("Category ID must be an integer"),

    body("brand")
        .optional()
        .isString().withMessage("Brand must be a string"),
];

export const addProductImageValidator = [
    param("product_id").isInt().withMessage("Product ID must be an integer"),

    body("image_url")
        .notEmpty().withMessage("Image URL is required")
        .isURL().withMessage("Image URL must be valid"),

    body("is_main")
        .optional()
        .isBoolean().withMessage("is_main must be a boolean"),
];

export const productIdParamValidator = [
    param("id").isInt().withMessage("Product ID must be an integer"),
];

export const productImageIdParamValidator = [
    param("image_id").isInt().withMessage("Image ID must be an integer"),
];
