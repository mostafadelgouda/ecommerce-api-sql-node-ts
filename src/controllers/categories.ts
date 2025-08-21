import { type Request, type Response } from "express";
import pool from "../config/db.js"; // your pg Pool connection

// CREATE Category
export const createCategory = async (req: Request, res: Response) => {
    const { name, description, image_url } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING *",
            [name, description, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// READ all Categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM categories ORDER BY category_id");
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// READ one Category
export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM categories WHERE category_id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Category not found" });
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE Category (Admin only)
export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, image_url } = req.body;
    try {
        const result = await pool.query(
            "UPDATE categories SET name = $1, description = $2, image_url = $3 WHERE category_id = $4 RETURNING *",
            [name, description, image_url, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Category not found" });
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE Category (Admin only)
export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM categories WHERE category_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
