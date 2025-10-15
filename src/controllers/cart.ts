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
// ✅ Add to Cart (already correct)
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { product_id, quantity } = req.body;

        // check if product exists
        const productQuery = await pool.query(
            "SELECT price FROM products WHERE product_id = $1",
            [product_id]
        );
        if (productQuery.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        const productPrice = productQuery.rows[0].price;

        // check if item already in cart
        const existingItem = await pool.query(
            "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2",
            [user.id, product_id]
        );

        if (existingItem.rows.length > 0) {
            await pool.query(
                "UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3",
                [quantity, user.id, product_id]
            );
        } else {
            await pool.query(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)",
                [user.id, product_id, quantity]
            );
        }

        // fetch updated cart details
        const cartItems = await pool.query(
            `SELECT c.cart_id, c.product_id, c.quantity, p.name, p.price, p.main_image
       FROM cart c 
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = $1`,
            [user.id]
        );

        // calculate totals
        const totalQuantity = cartItems.rows.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = cartItems.rows.reduce((acc, item) => acc + item.quantity * item.price, 0);

        res.status(200).json({
            message: "Item added to cart",
            totalQuantity,
            totalPrice,
            itemsCount: cartItems.rows.length,
            cart: cartItems.rows,
        });
    } catch (error) {
        next(error);
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
            ...cart,
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
            ...cart,
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
            data: [],
        });
    } catch (err: any) {
        return next(new ApiError(err.message, err.statusCode || 500));
    }
};
