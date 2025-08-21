import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";

// CREATE product
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            name, description, price, category_id, brand,
            stand_up, folded_no_wheels, folded_wheels, frame,
            weight_no_wheels, weight_capacity, width, handle_height,
            wheels, seat_back_height, head_room, available_colors, available_sizes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO products
        (name, description, price, category_id, brand,
         stand_up, folded_no_wheels, folded_wheels, frame,
         weight_no_wheels, weight_capacity, width, handle_height,
         wheels, seat_back_height, head_room, available_colors, available_sizes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
            [
                name, description, price, category_id, brand,
                stand_up, folded_no_wheels, folded_wheels, frame,
                weight_no_wheels, weight_capacity, width, handle_height,
                wheels, seat_back_height, head_room, available_colors, available_sizes
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

// READ all products
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

// READ single product
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM products WHERE product_id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

// UPDATE product
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);

        if (fields.length === 0) return res.status(400).json({ message: "No fields provided" });

        const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

        const result = await pool.query(
            `UPDATE products SET ${setQuery} WHERE product_id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

// DELETE product
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM products WHERE product_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted" });
    } catch (err) {
        next(err);
    }
};
