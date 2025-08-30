import { type Request, type Response } from "express";
import pool from "../config/db.js"; // your pg Pool connection
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

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

        const { page = 1, limit = 10 } = req.query;

        const filters: Record<string, any> = {};
        // if (category) filters.category_id = category;
        // if (min_price) filters.price = `>= ${min_price}`; // can extend to operators
        // if (max_price) filters.price = `<= ${max_price}`;

        const result = await getItemsWithFilters(
            "categories",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );
        //const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
        res.json({
            message: RESPONSE_MESSAGES.PRODUCT.RETRIEVED,
            page: page,                // current page
            total_items: result.number_of_items, // number of items in this query
            limit: limit,               // how many items per page
            data: result.data
        });
        //const result = await pool.query("SELECT * FROM categories ORDER BY category_id");
        //res.json(result.rows);
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
