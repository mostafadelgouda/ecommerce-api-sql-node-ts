import { type Request, type Response } from "express";
import pool from "../config/db.js";

// Add to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
    try {
        const { product_id } = req.body;
        const user: any = req.user;
        const user_id = user.user_id;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(
            `INSERT INTO wishlist_items (user_id, product_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, product_id) DO NOTHING 
       RETURNING *`,
            [user_id, product_id]
        );

        res.json(result.rows[0] || { message: "Already in wishlist" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get wishlist
// Get wishlist
export const getWishlist = async (req: Request, res: Response) => {
    try {
        const user: any = req.user;
        const user_id = user.user_id;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(
            `SELECT w.wishlist_item_id, 
                    p.product_id, 
                    p.name, 
                    p.price
             FROM wishlist_items w
             JOIN products p ON w.product_id = p.product_id
             WHERE w.user_id = $1`,
            [user_id]
        );

        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


// Remove from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
    try {
        const { product_id } = req.params;
        const user: any = req.user;
        const user_id = user.user_id;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await pool.query(
            `DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2`,
            [user_id, product_id]
        );

        res.json({ message: "Removed from wishlist" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Clear entire wishlist
export const clearWishlist = async (req: Request, res: Response) => {
    try {
        const user: any = req.user;
        const user_id = user.user_id;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(
            `DELETE FROM wishlist_items WHERE user_id = $1 RETURNING *`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.json({ message: "Wishlist already empty" });
        }

        res.json({ message: "Wishlist cleared successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
