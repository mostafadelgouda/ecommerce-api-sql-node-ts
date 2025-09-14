import { body } from "express-validator";

// ✅ Signup Validator
export const signupValidator = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters"),
];

// ✅ Login Validator
export const loginValidator = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

// ✅ Change Password Validator
export const changePasswordValidator = [
    body("oldPassword")
        .notEmpty()
        .withMessage("Old password is required"),

    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long"),
];

// ✅ Forgot Password Validator
export const forgotPasswordValidator = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
];

// ✅ Reset Password Validator
export const resetPasswordValidator = [
    body("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),

    body("code")
        .isLength({ min: 6, max: 6 })
        .withMessage("Reset code must be 6 digits"),

    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long"),
];
