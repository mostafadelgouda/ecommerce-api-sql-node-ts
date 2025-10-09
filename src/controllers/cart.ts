import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

// ✅ Add to Cart (already correct)
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { product_id } = req.body;
        const quantity = req.body.quantity || 1
        if (!product_id || !quantity) {
            return next(new ApiError("Product ID and quantity are required", 400));
        }

        const result = await pool.query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, product_id)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
             RETURNING *`,
            [user.user_id, product_id, quantity]
        );

        res.status(201).json({
            message: RESPONSE_MESSAGES.CART.ADDED,
            data: result.rows[0],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// ✅ Get Cart (no variants)
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;

        const result = await pool.query(
            `SELECT 
                ci.cart_item_id,
                ci.quantity,
                p.product_id,
                p.name AS product_name,
                p.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.product_id
             WHERE ci.user_id = $1
             ORDER BY ci.added_at DESC`,
            [user.user_id]
        );

        // Apply discounts if available
        const cartWithDiscounts = await Promise.all(
            result.rows.map(async (item: any) => {
                const saleRes = await pool.query(
                    `SELECT discount_percent 
                     FROM sale_items 
                     WHERE product_id = $1
                       AND start_date <= NOW()
                       AND end_date >= NOW()
                     ORDER BY created_at DESC 
                     LIMIT 1`,
                    [item.product_id]
                );

                let discount_percent = null;
                let final_price = parseFloat(item.price);

                if (saleRes.rows.length > 0) {
                    discount_percent = parseFloat(saleRes.rows[0].discount_percent);
                    final_price = final_price - (final_price * discount_percent) / 100;
                }

                return {
                    ...item,
                    discount_percent,
                    final_price: Math.round(final_price * 100) / 100, // 2 decimals
                };
            })
        );

        // Calculate totals
        const total_quantity = cartWithDiscounts.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        const total_price = cartWithDiscounts.reduce(
            (sum, item) => sum + item.final_price * item.quantity,
            0
        );

        res.json({
            message: RESPONSE_MESSAGES.CART.RETRIEVED,
            total_quantity,
            total_price: Math.round(total_price * 100) / 100,
            data: cartWithDiscounts,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// ✅ Update Cart Item
export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { quantity } = req.body;
        const cart_item_id = req.params.id;

        if (!cart_item_id || quantity == null) {
            return next(new ApiError(RESPONSE_MESSAGES.CART.ID_AND_QTY_REQUIRED, 400));
        }

        if (quantity === 0) {
            // Delete item if quantity = 0
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
            // Update quantity
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
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// ✅ Remove single Cart Item
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
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// ✅ Clear all Cart Items
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
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};
