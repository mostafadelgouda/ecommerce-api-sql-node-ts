// controllers/paymentController.ts
import { type Request, type Response } from "express";
import Stripe from "stripe";
import pool from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const paymentSuccess = async (req: Request, res: Response) => {
    try {
        const { session_id } = req.query;
        const user = (req as any).user;
        const user_id = user.id;
        if (!session_id) {
            return res.status(400).json({ error: "Missing session_id" });
        }

        // 1️⃣ Verify session with Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id as string);

        if (session.payment_status !== "paid") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        // 2️⃣ Get items from user's cart
        const cartItems = await pool.query(
            `SELECT c.product_variant_id, c.quantity, pv.price
       FROM cart c
       JOIN product_variants pv ON c.product_variant_id = pv.id
       WHERE c.user_id = $1`,
            [user_id]
        );

        if (cartItems.rows.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // 3️⃣ Insert order
        const orderResult = await pool.query(
            `INSERT INTO orders (user_id, total_price, status, payment_status)
       VALUES ($1, $2, 'pending', 'paid') RETURNING id`,
            [user_id, session.amount_total ? session.amount_total / 100 : 0]
        );

        const orderId = orderResult.rows[0].id;

        // 4️⃣ Insert order_items
        for (const item of cartItems.rows) {
            await pool.query(
                `INSERT INTO order_items (order_id, product_variant_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_variant_id, item.quantity, item.price]
            );
        }

        // 5️⃣ Clear cart
        await pool.query(`DELETE FROM cart WHERE user_id = $1`, [user_id]);

        res.json({ message: "Payment successful, order created", orderId });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
