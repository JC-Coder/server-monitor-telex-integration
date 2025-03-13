import { NextFunction, Request, Response } from "express";
import { AppResponse } from "../utils/constant.js";

interface AppError extends Error {
  statusCode?: number;
  status?: string;
}

export const GlobalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;

  return AppResponse({
    res,
    statusCode,
    message: err.message || "Internal server error",
    data: process.env.NODE_ENV === "development" ? err.stack : undefined,
  }).Error();
};
