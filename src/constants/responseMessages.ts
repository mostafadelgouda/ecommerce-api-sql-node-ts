export const RESPONSE_MESSAGES = {
    AUTH: {
        LOGIN_SUCCESS: "Login successful",
        SIGNUP_SUCCESS: "Signup successful",
        LOGIN_FAILED: "Invalid username or password",
        ACCOUNT_EXIST: "The account is already exist",
        UNAUTHORIZED: "You are not authorized to access this resource",
        INVALID_CREDINTIALS: "Invalid credentials",
        EMAIL_REQUIRED: "Email required",
        INVALID_CODE: "Invalid or expired code",
        DETAILS_RETRIEVED: "Details retrieved successfully",
        RESET_CODE_SENT: "Reset code sent",
        PASSWORD_CHANGED: "Password changed successfully",
        OLD_PASSWORD_INCORRECT: "Old password is incorrect",
    },
    USER: {
        CREATED: "User created successfully",
        NOT_FOUND: "User not found",
        UPDATED: "User updated successfully",
        DELETED: "User deleted successfully",
    },

    PRODUCT: {
        CREATED: "Product created successfully",
        RETRIEVED: "Products retrieved successfully",
        FOUND: "Product retrieved successfully",
        UPDATED: "Product updated successfully",
        DELETED: "Product deleted successfully",
        NOT_FOUND: "Product not found",
        NO_FIELDS: "No fields provided to update",
    },
    IMAGE: {
        ADDED: "Image added successfully",
        RETRIEVED: "Images retrieved successfully",
        DELETED: "Image deleted successfully",
        NOT_FOUND: "Image not found",
        URL_REQUIRED: "Image URL is required",
    },
    GENERAL: {
        SERVER_ERROR: "Internal server error",
        BAD_REQUEST: "Invalid request",
    },
    REVIEW: {
        CREATED: "Review created successfully",
        RETRIEVED: "Reviews retrieved successfully",
        UPDATED: "Review updated successfully",
        DELETED: "Review deleted successfully",
        RATING_REQUIRED: "Rating is required",
        NOT_FOUND_OR_UNAUTHORIZED: "Review not found or you are not authorized to perform this action"
    },
    ORDER: {
        RETRIEVED: "Orders retrieved successfully",
        NOT_FOUND: "Order not found",
        UNAUTHORIZED: "Unauthorized"
    },
    CART: {
        VARIANT_AND_QTY_REQUIRED: "Variant ID and quantity are required",
        ID_AND_QTY_REQUIRED: "Cart item ID and quantity are required",
        ADDED: "Item added to cart",
        RETRIEVED: "Cart retrieved successfully",
        UPDATED: "Cart item updated successfully",
        REMOVED: "Cart item removed successfully",
        CLEARED: "All items removed from cart",
        EMPTY: "Cart is already empty",
        NOT_FOUND: "Cart item not found"
    },
    CATEGORY: {
        CREATED: "Category created successfully",
        RETRIEVED: "Category retrieved successfully",
        UPDATED: "Category updated successfully",
        DELETED: "Category deleted successfully",
        NOT_FOUND: "Category not found",
    },
    VARIANT: {
        NOT_FOUND: "Variant not found",
        DELETED: "Variant deleted",
        RETRIEVED: "Variant retrieved",
        ADDED: "Variant added",
        UPDATED: "Variant updated",
        NO_FIELDS: "No fields for this variant",
        CREATED: "Variant created successfully",
        MISSING_FIELDS: "Missing fields",
    },
    WISHLIST: {
        UNAUTHORIZED: "Unauthorized access",
        ADDED: "Product added to wishlist",
        ALREADY_EXISTS: "Product is already in wishlist",
        RETRIEVED: "Wishlist retrieved successfully",
        REMOVED: "Product removed from wishlist",
        NOT_FOUND: "Product not found in wishlist",
        CLEARED: "Wishlist cleared successfully",
        ALREADY_EMPTY: "Wishlist is already empty"
    },
    SALE_ITEM: {
        CREATED: "Sale item created successfully",
        UPDATED: "Sale item updated successfully",
        DELETED: "Sale item deleted successfully",
        FOUND: "Sale item found",
        RETRIEVED: "Sale items retrieved successfully",
        NOT_FOUND: "Sale item not found",
        NO_FIELDS: "No fields to update"
    },
    PAY: {
        SESSION_CREATED: "Payment session url has been created"
    }
} as const;
