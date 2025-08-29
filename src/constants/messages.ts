export const RESPONSE_MESSAGES = {
    AUTH: {
        LOGIN_SUCCESS: "Login successful",
        LOGIN_FAILED: "Invalid username or password",
        UNAUTHORIZED: "You are not authorized to access this resource",
    },
    USER: {
        CREATED: "User created successfully",
        NOT_FOUND: "User not found",
        UPDATED: "User updated successfully",
        DELETED: "User deleted successfully",
    },
    PRODUCT: {
        CREATED: "Product created successfully",
        NOT_FOUND: "Product not found",
        UPDATED: "Product updated successfully",
        DELETED: "Product deleted successfully",
        RETRIEVED: "Product retrieved successfully"
    },
    GENERAL: {
        SERVER_ERROR: "Internal server error",
        BAD_REQUEST: "Invalid request",
    },
    REVIEW: {
        RETRIEVED: "Reviews retrieved successfully",
        CREATED: "Review created successfully",
        UPDATED: "Review updated successfully",
        DELETED: "Review deleted successfully",
    },
    ORDER: {
        RETRIEVED: "Orders retrieved successfully",
    }
} as const;
