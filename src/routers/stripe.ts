import express, { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import pool from "../config/db.js";
import { isAuthenticated } from "../middlewares/isAuth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-04-10" as any,
});


const router = Router();

// // ✅ Create Payment Intent
// router.post("/create-payment-intent", async (req: Request, res: Response) => {
//     try {
//         const { amount, currency, orderId } = req.body;

//         const paymentIntent = await stripe.paymentIntents.create({
//             amount, // in cents (e.g., 2000 = $20)
//             currency,
//             metadata: { orderId },
//         });

//         res.json({
//             clientSecret: paymentIntent.client_secret,
//         });
//     } catch (error: any) {
//         res.status(500).json({ error: error.message });
//     }
// });

// ✅ Webhook to confirm payment and create order
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
        const sig = req.headers["stripe-signature"] as string;

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
        } catch (err: any) {
            console.error("⚠️ Webhook signature verification failed.", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle successful checkout session
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;


            console.log("✅ Payment success for user:", userId);

            if (!userId) {
                console.error("No userId in session metadata");
                return res.status(400).send("No userId in session metadata");
            }

            try {
                // 1️⃣ Get cart items for this user
                // 1️⃣ Get cart items for this user (with product price)
                const { rows: cartItems } = await pool.query(
                    `
                    SELECT 
                        ci.cart_item_id,
                        ci.user_id,
                        ci.variant_id,
                        ci.quantity,
                        ci.product_id,
                        p.price,               -- ✅ get product price
                        pv.size,
                        pv.color,
                        pv.stock,
                        pv.sold
                    FROM cart_items ci
                    JOIN product_variants pv ON ci.variant_id = pv.variant_id
                    JOIN products p ON ci.product_id = p.product_id
                    WHERE ci.user_id = $1;
                    `,
                    [userId]
                );

                if (cartItems.length === 0) {
                    console.log("Cart is empty, skipping order creation");
                    return res.json({ received: true });
                }

                // 2️⃣ Insert order
                const { rows: orderRows } = await pool.query(
                    `INSERT INTO orders (user_id, total_amount, status) 
           VALUES ($1, $2, $3) RETURNING order_id`,
                    [userId, session.amount_total! / 100, "paid"]
                );

                const orderId = orderRows[0].order_id;

                // 3️⃣ Insert order items & update stock
                for (const item of cartItems) {
                    await pool.query(
                        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price) 
                        VALUES ($1, $2, $3, $4, $5)`,
                        [orderId, item.product_id, item.variant_id, item.quantity, item.price]
                    );

                    await pool.query(
                        `UPDATE product_variants 
             SET stock = stock - $1, sold = sold + $1
             WHERE variant_id = $2`,
                        [item.quantity, item.variant_id]
                    );
                }

                // 4️⃣ Clear cart
                await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

                console.log("✅ Order created and cart cleared for user:", userId);
            } catch (err) {
                console.error("❌ Error processing order:", err);
                return res.status(500).send("Error processing order");
            }
        }

        res.json({ received: true });
    }
);


// router.post("/create-checkout-session", async (req: Request, res: Response) => {
//     try {
//         const { cartItems } = req.body; // [{ name, price, quantity }]

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ["card"],
//             mode: "payment",
//             line_items: cartItems.map((item: any) => ({
//                 price_data: {
//                     currency: "usd",
//                     product_data: { name: item.name },
//                     unit_amount: item.price * 100, // price in cents
//                 },
//                 quantity: item.quantity,
//             })),
//             success_url: `${process.env.CLIENT_URL}/success`,
//             cancel_url: `${process.env.CLIENT_URL}/cancel`,
//         });

//         res.json({ url: session.url });
//     } catch (error: any) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// });

// 
// adjust based on your setup
router.post("/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user; // comes from isAuthenticated middleware
        const userId = user.user_id;

        // 1. Fetch cart items for this user
        const cartQuery = `
            SELECT p.name, p.price, c.quantity
            FROM cart_items c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.user_id = $1
        `;
        const { rows: cartItems } = await pool.query(cartQuery, [userId]);

        if (cartItems.length === 0) {
            return res.status(404).json({ error: "Cart is empty" });
        }

        // 2. Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: cartItems.map((item: any) => ({
                price_data: {
                    currency: "usd",
                    product_data: { name: item.name },
                    unit_amount: item.price * 100,
                },
                quantity: item.quantity,
            })),
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
            metadata: { user_id: userId.toString() }, // ✅ pass user_id
        });

        // 3. Return checkout link
        res.json({ url: session.url });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


export default router;