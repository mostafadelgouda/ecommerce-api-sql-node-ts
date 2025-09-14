import { validationResult } from "express-validator";
import { type Request, type Response, type NextFunction } from "express";
import ApiError from "../utils/apiError.js";

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Collect all error messages
        const errorMessages = errors.array().map(err => err.msg);
        return next(new ApiError(errorMessages.join(", "), 400));
    }

    next();
};
