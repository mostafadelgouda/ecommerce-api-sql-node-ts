import { type Request, type Response } from "express";
import pool from "../config/db.js"; // pg pool connection
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { variant_id, product_id, quantity } = req.body;

    if (!variant_id || !quantity) {
        return res.status(400).json({ message: "Variant ID and quantity are required" });
    }

    try {
        const result = await await pool.query(
            `INSERT INTO cart_items (user_id, variant_id, product_id, quantity)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (user_id, variant_id)
   DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
   RETURNING *`,
            [user.user_id, variant_id, product_id, quantity]
        );


        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ message: "Error adding to cart", error: err.message });
    }
};

// Get user cart
export const getCart = async (req: Request, res: Response) => {
    const user = (req as any).user;

    try {
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

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching cart", error: err.message });
    }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { quantity } = req.body;
    const cart_item_id = req.params.id;

    if (!cart_item_id || quantity == null) {
        return res.status(400).json({ message: "Cart item ID and quantity are required" });
    }

    try {
        if (quantity === 0) {
            // ✅ Remove the cart item instead of updating
            const deleteResult = await pool.query(
                `DELETE FROM cart_items
                 WHERE user_id = $1 AND cart_item_id = $2
                 RETURNING *`,
                [user.user_id, cart_item_id]
            );

            if (deleteResult.rows.length === 0) {
                return res.status(404).json({ message: "Cart item not found" });
            }

            return res.json({ message: "Cart item removed successfully" });
        } else {
            // ✅ Update quantity
            const updateResult = await pool.query(
                `UPDATE cart_items
                 SET quantity = $1
                 WHERE user_id = $2 AND cart_item_id = $3
                 RETURNING *`,
                [quantity, user.user_id, cart_item_id]
            );

            if (updateResult.rows.length === 0) {
                return res.status(404).json({ message: "Cart item not found" });
            }

            return res.json(updateResult.rows[0]);
        }
    } catch (err: any) {
        res.status(500).json({ message: "Error updating cart item", error: err.message });
    }
};


// Remove item from cart
export const removeCartItem = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cart_item_id = req.params.id;

    try {
        const result = await pool.query(
            `DELETE FROM cart_items 
       WHERE user_id = $1 AND cart_item_id = $2 
       RETURNING *`,
            [user.user_id, cart_item_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        res.json({ message: "Item removed from cart" });
    } catch (err: any) {
        res.status(500).json({ message: "Error removing cart item", error: err.message });
    }
};

export const clearCart = async (req: Request, res: Response) => {
    const user = (req as any).user;

    try {
        const result = await pool.query(
            `DELETE FROM cart_items 
             WHERE user_id = $1 
             RETURNING *`,
            [user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cart is already empty" });
        }

        res.json({ message: "All items removed from cart", removed: result.rows.length });
    } catch (err: any) {
        res.status(500).json({ message: "Error clearing cart", error: err.message });
    }
};