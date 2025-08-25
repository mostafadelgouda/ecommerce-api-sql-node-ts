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
    "/webhook", isAuthenticated,
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig!,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
        } catch (err: any) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            try {
                // ✅ Get user_id from metadata
                const user_id = session.metadata?.user_id;
                if (!user_id) {
                    console.error("⚠️ No user_id in session metadata");
                    return res.json({ received: true });
                }

                // 1️⃣ Get items from cart
                const cartItems = await pool.query(
                    `SELECT c.variant_id, c.quantity, pv.price
           FROM cart_items c
           JOIN product_variants pv ON c.product_variant_id = pv.id
           WHERE c.user_id = $1`,
                    [user_id]
                );

                if (cartItems.rows.length === 0) {
                    console.error("⚠️ Cart is empty for user", user_id);
                    return res.json({ received: true });
                }

                // 2️⃣ Create order
                const orderResult = await pool.query(
                    `INSERT INTO orders (user_id, total, status, payment_status)
           VALUES ($1, $2, 'pending', 'paid')
           RETURNING id`,
                    [user_id, session.amount_total ? session.amount_total / 100 : 0]
                );

                const orderId = orderResult.rows[0].id;

                // 3️⃣ Insert order_items
                for (const item of cartItems.rows) {
                    await pool.query(
                        `INSERT INTO order_items (order_id, variant_id, quantity, price)
             VALUES ($1, $2, $3, $4)`,
                        [orderId, item.variant_id, item.quantity, item.price]
                    );
                }

                // 4️⃣ Clear cart
                await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [user_id]);

                console.log(`✅ Order ${orderId} created & cart cleared for user ${user_id}`);
            } catch (err: any) {
                console.error("❌ Error processing order:", err.message);
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