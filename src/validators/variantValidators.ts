import { body, param } from "express-validator";

// ✅ Create Variant
export const createVariantValidator = [
    param("productId").isInt().withMessage("Product ID must be an integer"),

    body("size")
        .notEmpty().withMessage("Size is required")
        .isString().withMessage("Size must be a string"),

    body("color")
        .notEmpty().withMessage("Color is required")
        .isString().withMessage("Color must be a string"),

    body("stock")
        .optional()
        .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
];

// ✅ Update Variant
export const updateVariantValidator = [
    param("id").isInt().withMessage("Variant ID must be an integer"),

    body("size")
        .optional()
        .isString().withMessage("Size must be a string"),

    body("color")
        .optional()
        .isString().withMessage("Color must be a string"),

    body("stock")
        .optional()
        .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

    body("sold")
        .optional()
        .isInt({ min: 0 }).withMessage("Sold must be a non-negative integer"),
];

// ✅ Add Variant Image
export const addVariantImageValidator = [
    param("variant_id").isInt().withMessage("Variant ID must be an integer"),

    body("image_url")
        .notEmpty().withMessage("Image URL is required")
        .isURL().withMessage("Image URL must be valid"),

    body("is_main")
        .optional()
        .isBoolean().withMessage("is_main must be a boolean"),
];

// ✅ Params Validators
export const variantIdParamValidator = [
    param("id").isInt().withMessage("Variant ID must be an integer"),
];

export const productIdParamValidator = [
    param("productId").isInt().withMessage("Product ID must be an integer"),
];

export const variantImageIdParamValidator = [
    param("image_id").isInt().withMessage("Image ID must be an integer"),
];
