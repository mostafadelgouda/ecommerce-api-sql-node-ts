import { type Request, type Response, type NextFunction } from "express";
import pool from "../config/db.js";
import { getItemsWithFilters } from "../utils/filterPagination.js"
import { RESPONSE_MESSAGES } from "../constants/messages.js";
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
// READ all products with main image
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, category, min_price, max_price } = req.query;

        const filters: Record<string, any> = {};
        if (category) filters.category_id = category;

        const result = await getItemsWithFilters(
            "products",
            filters,
            Number(page),
            Number(limit),
            "created_at",
            "DESC"
        );

        // 🔑 Fetch main image for each product
        const productsWithImages = await Promise.all(
            result.data.map(async (product: any) => {
                const imgRes = await pool.query(
                    `SELECT image_url 
                     FROM product_images 
                     WHERE product_id = $1 AND is_main = true 
                     LIMIT 1`,
                    [product.product_id]
                );
                return {
                    ...product,
                    main_image: imgRes.rows[0]?.image_url || null
                };
            })
        );

        res.json({
            message: RESPONSE_MESSAGES.PRODUCT.RETRIEVED,
            page: Number(page),
            total_items: result.number_of_items,
            limit: Number(limit),
            data: productsWithImages
        });
    } catch (err) {
        next(err);
    }
};

// READ single product
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const productRes = await pool.query(
            "SELECT * FROM products WHERE product_id = $1",
            [id]
        );

        if (productRes.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        const imagesRes = await pool.query(
            "SELECT image_url, is_main FROM product_images WHERE product_id = $1 ORDER BY is_main DESC, created_at ASC",
            [id]
        );

        res.json({
            ...productRes.rows[0],
            images: imagesRes.rows
        });
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

export const addProductImage = async (req: Request, res: Response) => {
    try {
        const { image_url, is_main = false } = req.body;
        const product_id = req.params.product_id
        if (!image_url) {
            return res.status(400).json({ message: "Image URL is required" });
        }

        // If the new image is marked as main, reset all other images for that product (and variant if applicable)
        if (is_main) {

            await pool.query(
                `UPDATE product_images 
                    SET is_main = false 
                    WHERE product_id = $1`,
                [product_id]
            );

        }

        const result = await pool.query(
            `INSERT INTO product_images (product_id, image_url, is_main) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [product_id || null, image_url, is_main]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};


export const getProductImages = async (req: Request, res: Response) => {
    try {
        const { product_id } = req.params;

        const result = await pool.query(
            `SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at DESC`,
            [product_id]
        );

        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image_id } = req.params;
        const result = await pool.query("DELETE FROM product_images WHERE image_id = $1 RETURNING *", [image_id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Image not found" });
        res.json({ message: "Image deleted" });
    } catch (err) {
        next(err);
    }
};