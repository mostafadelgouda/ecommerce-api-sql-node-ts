import { type Request, type Response, type NextFunction } from "express";
import { getItemsWithFilters } from "../utils/filterPagination.js";
import { RESPONSE_MESSAGES } from "../constants/messages.js";
import pool from "../config/db.js";
// ✅ Admin: Get all done orders with pagination + filters
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, payment_status, user_id } = req.query;

        const filters: Record<string, any> = {};//status: "done" 
        if (payment_status) filters.payment_status = payment_status;
        if (user_id) filters.user_id = user_id; // optional filter for admin

        const result = await getItemsWithFilters(
            "orders",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );

        res.json({
            message: RESPONSE_MESSAGES.ORDER.RETRIEVED,
            ...result, // unpack pagination object
        });
    } catch (err) {
        next(err);
    }
};

// ✅ User: Get their own done orders with pagination
export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { page = 1, limit = 10, payment_status } = req.query;

        const filters: Record<string, any> = { user_id: user.user_id };//status: "done", 
        if (payment_status) filters.payment_status = payment_status;

        const result = await getItemsWithFilters(
            "orders",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );

        res.json({
            message: RESPONSE_MESSAGES.ORDER.RETRIEVED,
            ...result,
        });
    } catch (err) {
        next(err);
    }
};


// ✅ Get details of a single order (with items)
export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params; // order_id
        const user = (req as any).user;

        // First, check if order exists and belongs to the user (unless admin)
        const orderQuery = await pool.query(
            "SELECT * FROM orders WHERE order_id = $1",
            [order_id]
        );

        if (orderQuery.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orderQuery.rows[0];

        // If not admin, make sure user owns this order
        if (!user.is_admin && order.user_id !== user.user_id) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }

        // Now get order items
        const itemsQuery = await pool.query(
            `SELECT 
                oi.order_item_id,
                oi.product_id,
                oi.variant_id,
                oi.quantity,
                oi.price
             FROM order_items oi
             WHERE oi.order_id = $1`,
            [order_id]
        );

        res.json({
            message: RESPONSE_MESSAGES.ORDER.RETRIEVED,
            data: {
                ...order,
                items: itemsQuery.rows,
            },
        });
    } catch (err) {
        next(err);
    }
};
export const getOrderDetailsAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params; // order_id

        // Get order info
        const orderQuery = await pool.query(
            "SELECT * FROM orders WHERE order_id = $1",
            [order_id]
        );

        if (orderQuery.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orderQuery.rows[0];

        const itemsQuery = await pool.query(
            `SELECT 
                oi.order_item_id,
                oi.product_id,
                oi.variant_id,
                oi.quantity,
                oi.price
             FROM order_items oi
             WHERE oi.order_id = $1`,
            [order_id]
        );

        res.json({
            message: RESPONSE_MESSAGES.ORDER.RETRIEVED,
            data: {
                ...order,
                items: itemsQuery.rows,
            },
        });
    } catch (err) {
        next(err);
    }
};