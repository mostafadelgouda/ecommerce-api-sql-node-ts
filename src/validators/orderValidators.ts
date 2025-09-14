import { query, param } from "express-validator";

// ✅ Common pagination validator
const paginationValidator = [
    query("page")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ gt: 0, lt: 101 })
        .withMessage("Limit must be between 1 and 100"),
];

// ✅ getAllOrders
export const getAllOrdersValidator = [
    ...paginationValidator,

    query("payment_status")
        .optional()
        .isIn(["pending", "paid", "failed", "refunded"])
        .withMessage("Invalid payment status"),

    query("user_id")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("User ID must be a positive integer"),
];

// ✅ getUserOrders
export const getUserOrdersValidator = [
    ...paginationValidator,

    query("payment_status")
        .optional()
        .isIn(["pending", "paid", "failed", "refunded"])
        .withMessage("Invalid payment status"),
];

// ✅ getOrderDetails & getOrderDetailsAdmin
export const orderIdValidator = [
    param("order_id")
        .isInt({ gt: 0 })
        .withMessage("Order ID must be a positive integer"),
];
