import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import ApiError from "../utils/apiError.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const fetchUserCart = async (user_id: string) => {
    const result = await pool.query(
        `SELECT 
            ci.cart_item_id,
            ci.quantity,
            p.product_id,
            p.name AS product_name,
            p.price,
            img.image_url AS main_image
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.product_id
         LEFT JOIN LATERAL (
             SELECT image_url 
             FROM product_images i
             WHERE i.product_id = p.product_id
             ORDER BY i.is_main DESC, i.created_at ASC
             LIMIT 1
         ) img ON TRUE
         WHERE ci.user_id = $1
         ORDER BY ci.added_at DESC`,
        [user_id]
    );

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
                final_price: Math.round(final_price * 100) / 100,
            };
        })
    );

    const total_quantity = cartWithDiscounts.reduce((sum, item) => sum + item.quantity, 0);
    const total_price = cartWithDiscounts.reduce(
        (sum, item) => sum + item.final_price * item.quantity,
        0
    );

    return {
        total_quantity,
        total_price: Math.round(total_price * 100) / 100,
        data: cartWithDiscounts,
    };
};

// helper: returns number of items in cart (sum of quantities)
const getCartItemsCount = async (user_id: string) => {
    const res = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0) AS total
         FROM cart_items
         WHERE user_id = $1`,
        [user_id]
    );
    return Number(res.rows[0]?.total ?? 0);
};

// Middleware you can mount globally to inject cart count into res.locals
export const injectCartCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.locals.cart_items_count = 0;
            return next();
        }
        const count = await getCartItemsCount(user.user_id);
        res.locals.cart_items_count = count;
        return next();
    } catch (err: any) {
        // don't break the request if cart count fails; set 0 and continue
        res.locals.cart_items_count = 0;
        return next();
    }
};

// ✅ Add to Cart (no variants)
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { product_id, quantity: rawQuantity } = req.body;

        // default quantity = 1 if not provided
        const quantity = rawQuantity == null ? 1 : Number(rawQuantity);

        // ensure product exists
        const productRes = await pool.query(
            `SELECT product_id FROM products WHERE product_id = $1`,
            [product_id]
        );

        if (productRes.rows.length === 0) {
            return next(new ApiError(RESPONSE_MESSAGES.PRODUCT.NOT_FOUND || 'Product not found', 404));
        }

        // check if cart item already exists for this user & product
        const existingRes = await pool.query(
            `SELECT cart_item_id, quantity
             FROM cart_items
             WHERE user_id = $1 AND product_id = $2
             LIMIT 1`,
            [user.user_id, product_id]
        );

        if (existingRes.rows.length > 0) {
            const existing = existingRes.rows[0];
            const newQty = Number(existing.quantity) + Number(quantity);

            await pool.query(
                `UPDATE cart_items
                 SET quantity = $1, added_at = NOW()
                 WHERE cart_item_id = $2`,
                [newQty, existing.cart_item_id]
            );
        } else {
            await pool.query(
                `INSERT INTO cart_items (user_id, product_id, quantity, added_at)
                 VALUES ($1, $2, $3, NOW())`,
                [user.user_id, product_id, quantity]
            );
        }

        // Return updated cart (reuses your helper which applies discounts and totals)
        const cart = await fetchUserCart(user.user_id);

        const MESSAGE = RESPONSE_MESSAGES.CART.ADDED;

        // include explicit cart_items_count for clients expecting it
        res.json({
            message: MESSAGE,
            total_quantity: cart.total_quantity,
            total_price: cart.total_price,
            cart_items_count: cart.total_quantity,
            data: cart.data,
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
                p.price,
                img.image_url AS main_image
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.product_id
             LEFT JOIN LATERAL (
                 SELECT image_url 
                 FROM product_images i
                 WHERE i.product_id = p.product_id
                 ORDER BY i.is_main DESC, i.created_at ASC
                 LIMIT 1
             ) img ON TRUE
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

        const rounded_total_price = Math.round(total_price * 100) / 100;

        res.json({
            message: RESPONSE_MESSAGES.CART.RETRIEVED,
            total_quantity,
            total_price: rounded_total_price,
            cart_items_count: total_quantity,
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
            // Delete if quantity = 0
            const deleteResult = await pool.query(
                `DELETE FROM cart_items
                 WHERE user_id = $1 AND cart_item_id = $2
                 RETURNING *`,
                [user.user_id, cart_item_id]
            );

            if (deleteResult.rows.length === 0) {
                return next(new ApiError(RESPONSE_MESSAGES.CART.NOT_FOUND, 404));
            }
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
        }

        // ✅ Return updated cart
        const cart = await fetchUserCart(user.user_id);

        res.json({
            message: RESPONSE_MESSAGES.CART.UPDATED,
            total_quantity: cart.total_quantity,
            total_price: cart.total_price,
            cart_items_count: cart.total_quantity,
            data: cart.data,
        });
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

        // ✅ Return updated cart after deletion
        const cart = await fetchUserCart(user.user_id);

        res.json({
            message: RESPONSE_MESSAGES.CART.REMOVED,
            total_quantity: cart.total_quantity,
            total_price: cart.total_price,
            cart_items_count: cart.total_quantity,
            data: cart.data,
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};

// ✅ Clear all Cart Items
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;

        await pool.query(
            `DELETE FROM cart_items 
             WHERE user_id = $1`,
            [user.user_id]
        );

        res.json({
            message: RESPONSE_MESSAGES.CART.CLEARED,
            total_quantity: 0,
            total_price: 0,
            cart_items_count: 0,
            data: [],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};
