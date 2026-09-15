import { AppError } from '../utils/errors.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') error = new AppError(400, 'JSON inválido');
  if (error.type === 'entity.too.large') error = new AppError(413, 'Cuerpo demasiado grande');
  if (!(error instanceof AppError)) console.error('Error interno', { name: error.name });
  res.status(error instanceof AppError ? error.status : 500).json({
    error: error instanceof AppError ? error.message : 'Error interno del servidor',
    ...(error.details ? { detalles: error.details } : {})
  });
}
