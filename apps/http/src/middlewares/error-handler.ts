import { Request, Response, NextFunction } from 'express';
import { handleCastError, handleDuplicateError } from '@/errors';
import { ApiResponse } from '@/interface';
import status from 'http-status';
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.code === 11000) err = handleDuplicateError(err);
    res.status(err.statusCode || status.INTERNAL_SERVER_ERROR).json(new ApiResponse(err.statusCode || status.INTERNAL_SERVER_ERROR, err.message || 'Internal Server Error', undefined, err.context))
    return;
};