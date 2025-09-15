# 🛒 E-Commerce Backend API

A fully-featured backend for an e-commerce platform built with **Node.js**, **TypeScript**, and **PostgreSQL**.
This API provides complete functionality for managing products, categories, variants, cart, wishlist, reviews, orders, sales, and payments.

---

## 🚀 Features

- **User Authentication & Authorization**

  - Register, login (email & Google OAuth), password reset, change password
  - Role-based access (User / Admin)
- **Product Management**

  - Add, update, delete products
  - Manage product images and main image
  - Variants (color, size, stock, images)
- **Category Management**

  - Create, update, delete categories
  - Retrieve all categories or single category
- **Cart & Wishlist**

  - Add/update/delete cart items
  - Add/remove wishlist items
  - Clear all cart/wishlist items
- **Orders**

  - Place orders from cart
  - Order history for users
  - Admin order management
  - Order details (user/admin views)
- **Reviews**

  - Add, update, delete reviews
  - Fetch product reviews
  - Average rating system
- **Sales & Discounts**

  - Add products to sales
  - Apply discounts with time range
  - Retrieve active sale products
- **Payments**

  - Checkout session creation
  - Payment integration support

---

## 🛠️ Tech Stack

- **Runtime:** Node.js + Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM/Querying:** pg (node-postgres)
- **Authentication:** JWT, Google OAuth
- **Payment Gateway:** Stripe (or similar)
- **Deployment:** Vercel

---

## 📂 Project Structure

│── config/    # init configrations

│── constants/    # Constants

│── controllers/    # API logic

│── middlewares/    # Authentication, validation

│── routes/         # API routes

│── models/         # Database models / queries

│── utils/          # Helpers

│── app.ts          # Express app setup

│── server.ts       # Entry point


## 📖 API Documentation

A complete Postman collection is included to test the APIs [(link)](https://documenter.getpostman.com/view/33291356/2sB3BLiSiF).

Each folder in the collection is documented with request descriptions:

* **User** → Authentication & profile
* **Admin** → Admin authentication & management (⚠️ Signup disabled in production)
* **Category** → Category CRUD operations
* **Products** → Product CRUD, images, variants, ratings, discounts
* **Product Variants** → Variant CRUD, variant images
* **Cart** → Add/update/delete cart items
* **Wishlist** → Manage wishlist items
* **Orders** → Order creation & details (user/admin)
* **Reviews** → Review CRUD & ratings
* **Sales** → Manage sales & discounts
* **Payments** → Checkout session

## 🔐 Authentication

* Most endpoints require a **JWT token**.
* Admin routes require an  **admin role token**.

## 🧪 Testing

You can test all endpoints directly from the included Postman collection.

Make sure to set your **environment variables** (base_url(https://ecommerce-api-sql-node-ts-git-main-mostafadelgoudas-projects.vercel.app), tokens(auth, admin)) in Postman.

## 📌 Notes

* Admin **signup** endpoint will be  **disabled in production** . Admin accounts must be created manually.
* Default user ratings return **5** if no reviews exist.
* Images are stored with a **main image priority** (main → first in order).
