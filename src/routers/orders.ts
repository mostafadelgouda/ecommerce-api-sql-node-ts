import { Router } from "express";
import { getAllOrders, getUserOrders, getOrderDetails, getOrderDetailsAdmin } from "../controllers/orders.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import { isAuthenticated } from "../middlewares/isAuth.js";

const router = Router();

router.get("/getAllOrders", isAdmin, getAllOrders);
router.get("/getUserOrders", isAuthenticated, getUserOrders);
router.get("/getOrderDetails/:order_id", isAuthenticated, getOrderDetails);
router.get("/getOrderDetailsAdmin/:order_id", isAdmin, getOrderDetailsAdmin);


export default router;