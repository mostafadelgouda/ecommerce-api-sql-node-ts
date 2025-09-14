import { Router } from "express";
import { getAllOrders, getUserOrders, getOrderDetails, getOrderDetailsAdmin } from "../controllers/orders.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { isAuthenticated } from "../middlewares/isAuth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
    getAllOrdersValidator,
    getUserOrdersValidator,
    orderIdValidator
} from "../validators/orderValidators.js";

const router = Router();

router.get(
    "/getAllOrders",
    isAdmin,
    getAllOrdersValidator,
    validateRequest,
    getAllOrders
);

router.get(
    "/getOrderDetailsAdmin/:order_id",
    isAdmin,
    orderIdValidator,
    validateRequest,
    getOrderDetailsAdmin
);

// ✅ User routes
router.get(
    "/getUserOrders",
    isAuthenticated,
    getUserOrdersValidator,
    validateRequest,
    getUserOrders
);

router.get(
    "/getOrderDetails/:order_id",
    isAuthenticated,
    orderIdValidator,
    validateRequest,
    getOrderDetails
);

export default router;