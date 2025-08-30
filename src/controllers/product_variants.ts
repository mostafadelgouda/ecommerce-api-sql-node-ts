import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";
// CREATE variant
export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { size, color, stock } = req.body;
        const product_id = req.params.productId || '3'
        const result = await pool.query(
            `INSERT INTO product_variants (product_id, size, color, stock, sold)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [product_id, size, color, stock || 0, 0]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

// READ all variants for product
export const getVariantsByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const result = await pool.query("SELECT * FROM product_variants WHERE product_id = $1", [productId]);

        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

// UPDATE variant
export const updateVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        if (fields.length === 0) return res.status(400).json({ message: "No fields provided" });

        const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

        const result = await pool.query(
            `UPDATE product_variants SET ${setQuery} WHERE variant_id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: "Variant not found" });

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

// DELETE variant
export const deleteVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM product_variants WHERE variant_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Variant not found" });
        res.json({ message: "Variant deleted" });
    } catch (err) {
        next(err);
    }
};

export const addVariantImage = async (req: Request, res: Response) => {
    try {
        const { image_url, is_main = false } = req.body;
        const variant_id = req.params.variant_id
        if (!image_url) {
            return res.status(400).json({ message: "Image URL is required" });
        }

        // If the new image is marked as main, reset all other images for that product (and variant if applicable)
        if (is_main) {

            await pool.query(
                `UPDATE variant_images 
                    SET is_main = false 
                    WHERE variant_id = $1`,
                [variant_id]
            );

        }

        const result = await pool.query(
            `INSERT INTO variant_images (variant_id, image_url, is_main) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [variant_id || null, image_url, is_main]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};


export const getVariantImages = async (req: Request, res: Response) => {
    try {
        const { variant_id } = req.params;

        const result = await pool.query(
            `SELECT * FROM variant_images WHERE variant_id = $1 ORDER BY created_at DESC`,
            [variant_id]
        );

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteVariantImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_id } = req.params;
        const result = await pool.query("DELETE FROM variant_images WHERE image_id = $1 RETURNING *", [image_id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Image not found" });
        res.json({ message: "Image deleted" });
    } catch (err) {
        next(err);
    }
};