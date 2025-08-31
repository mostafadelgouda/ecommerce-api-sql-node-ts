import express, { type NextFunction, type Request, type Response } from "express";
import categoriesRouter from "./routers/categories.js"
import userRouter from "./routers/users.js"
import adminRouter from "./routers/admins.js"
import productsRouter from "./routers/products.js"
import reviewsRouter from "./routers/reviews.js"
import productVariantsRouter from "./routers/product_variants.js"
import orderesRouter from "./routers/orders.js"
import cartRouter from "./routers/cart.js"
import wishlistRouter from "./routers/wishlist.js"
import stripeRouter from "./routers/stripe.js"
import passport from "./config/passport.js";
import globalError from "./middlewares/error.js";

const app = express();

app.use('', stripeRouter);
app.use(express.json())
app.use(passport.initialize());


app.use('/api', userRouter);
app.use('/api', adminRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/products', productVariantsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/orders', orderesRouter);


app.get("/", (req, res) => {
    res.send("🚀 Server is alive");
});

app.use(globalError);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

