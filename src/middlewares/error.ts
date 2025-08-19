import { type Request, type Response, type NextFunction } from "express";
import ApiError from "../utils/apiError.js";

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  name: string;
}

const sendErrorForDev = (err: CustomError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorForProd = (err: CustomError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
  });
};

const handleJwtInvalidSignature = (): ApiError =>
  new ApiError("Invalid token, please login again..", 401);

const handleJwtExpired = (): ApiError =>
  new ApiError("Expired token, please login again..", 401);

const globalError = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    if (err.name === "JsonWebTokenError") err = handleJwtInvalidSignature();
    if (err.name === "TokenExpiredError") err = handleJwtExpired();
    sendErrorForProd(err, res);
  }
};

export default globalError;
