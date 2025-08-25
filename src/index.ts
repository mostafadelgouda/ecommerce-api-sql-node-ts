import express, { type NextFunction, type Request, type Response } from "express";
import dotenv from "dotenv";
dotenv.config();
// import categoriesRouter from "./routers/categories.js"
// import userRouter from "./routers/users.js"
// import adminRouter from "./routers/admins.js"
// import productsRouter from "./routers/products.js"
// import productVariantsRouter from "./routers/product_variants.js"
// import paymentsRouter from "./routers/payments.js"
// import cartRouter from "./routers/cart.js"
// import wishlistRouter from "./routers/wishlist.js"
// import stripeRouter from "./routers/stripe.js"
// import passport from "./config/passport.js";

const app = express();
// app.use(express.json())
// app.use(passport.initialize());
// const port = 3000;
// app.use('', userRouter);
// app.use('', adminRouter);
// app.use('', stripeRouter);
// app.use('', paymentsRouter);
// app.use('/api/v1/categories', categoriesRouter);
// app.use('/api/v1/products', productsRouter);
// app.use('/api/v1/products', productVariantsRouter);
// app.use('/api/v1/cart', cartRouter);
// app.use('/api/v1/wishlist', cartRouter);

app.get("/", (req, res) => {
    res.send("🚀 Server is alive");
});
// app.all('*', (req: Request, res: Response, next: NextFunction) => {
//     return next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
// });

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

