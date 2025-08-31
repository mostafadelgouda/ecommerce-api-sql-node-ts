import { type Request, type Response, type NextFunction } from "express";
import { getItemsWithFilters } from "../utils/filterPagination.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, payment_status, user_id } = req.query;

        const filters: Record<string, any> = {};
        if (payment_status) filters.payment_status = payment_status;
        if (user_id) filters.user_id = user_id;

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
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { page = 1, limit = 10, payment_status } = req.query;

        const filters: Record<string, any> = { user_id: user.user_id };
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
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;
        const user = (req as any).user;

        const orderQuery = await pool.query(
            "SELECT * FROM orders WHERE order_id = $1",
            [order_id]
        );

        if (orderQuery.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.ORDER.NOT_FOUND, 404));
        }

        const order = orderQuery.rows[0];

        if (!user.is_admin && order.user_id !== user.user_id) {
            return next(new ApiError(RESPONSE_MESSAGES.ORDER.UNAUTHORIZED, 403));
        }

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
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getOrderDetailsAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { order_id } = req.params;

        const orderQuery = await pool.query(
            "SELECT * FROM orders WHERE order_id = $1",
            [order_id]
        );

        if (orderQuery.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.ORDER.NOT_FOUND, 404));
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
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};
