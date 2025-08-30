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
        DETAILS_RETRIEVED: "User details retrieved successfully",
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
