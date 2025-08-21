import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";

// CREATE variant
export const createVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id, size, color, stock } = req.body;

        const result = await pool.query(
            `INSERT INTO product_variants (product_id, size, color, stock)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [product_id, size, color, stock || 0]
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
