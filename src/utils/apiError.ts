class ApiError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        // Restore prototype chain (needed when extending built-ins like Error)
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export default ApiError;