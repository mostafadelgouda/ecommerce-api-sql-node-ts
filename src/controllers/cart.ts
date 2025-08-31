import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { variant_id, product_id, quantity } = req.body;

        if (!variant_id || !quantity) {
            return next(new ApiError(RESPONSE_MESSAGES.CART.VARIANT_AND_QTY_REQUIRED, 400));
        }

        const result = await pool.query(
            `INSERT INTO cart_items (user_id, variant_id, product_id, quantity)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, variant_id)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
             RETURNING *`,
            [user.user_id, variant_id, product_id, quantity]
        );

        res.status(201).json({
            message: RESPONSE_MESSAGES.CART.ADDED,
            data: result.rows[0],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;

        const result = await pool.query(
            `SELECT 
                ci.cart_item_id,
                ci.quantity,
                p.product_id,
                p.name AS product_name,
                p.price,
                pv.size,
                pv.color
             FROM cart_items ci
             JOIN product_variants pv ON ci.variant_id = pv.variant_id
             JOIN products p ON ci.product_id = p.product_id
             WHERE ci.user_id = $1
             ORDER BY ci.added_at DESC`,
            [user.user_id]
        );

        res.json({
            message: RESPONSE_MESSAGES.CART.RETRIEVED,
            data: result.rows,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { quantity } = req.body;
        const cart_item_id = req.params.id;

        if (!cart_item_id || quantity == null) {
            return next(new ApiError(RESPONSE_MESSAGES.CART.ID_AND_QTY_REQUIRED, 400));
        }

        if (quantity === 0) {
            const deleteResult = await pool.query(
                `DELETE FROM cart_items
                 WHERE user_id = $1 AND cart_item_id = $2
                 RETURNING *`,
                [user.user_id, cart_item_id]
            );

            if (deleteResult.rows.length === 0) {
                return next(new ApiError(RESPONSE_MESSAGES.CART.NOT_FOUND, 404));
            }

            return res.json({ message: RESPONSE_MESSAGES.CART.REMOVED });
        } else {
            const updateResult = await pool.query(
                `UPDATE cart_items
                 SET quantity = $1
                 WHERE user_id = $2 AND cart_item_id = $3
                 RETURNING *`,
                [quantity, user.user_id, cart_item_id]
            );

            if (updateResult.rows.length === 0) {
                return next(new ApiError(RESPONSE_MESSAGES.CART.NOT_FOUND, 404));
            }

            return res.json({
                message: RESPONSE_MESSAGES.CART.UPDATED,
                data: updateResult.rows[0],
            });
        }
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const cart_item_id = req.params.id;

        const result = await pool.query(
            `DELETE FROM cart_items 
             WHERE user_id = $1 AND cart_item_id = $2 
             RETURNING *`,
            [user.user_id, cart_item_id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.CART.NOT_FOUND, 404));
        }

        res.json({ message: RESPONSE_MESSAGES.CART.REMOVED });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;

        const result = await pool.query(
            `DELETE FROM cart_items 
             WHERE user_id = $1 
             RETURNING *`,
            [user.user_id]
        );

        if (result.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.CART.EMPTY, 404));
        }

        res.json({
            message: RESPONSE_MESSAGES.CART.CLEARED,
            removed: result.rows.length,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode));
    }
};
