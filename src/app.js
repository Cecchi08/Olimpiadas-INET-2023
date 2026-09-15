import express from 'express';
import cors from 'cors';
import { createAuth } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/errors.js';
import { createControllers } from './controllers/index.js';
import { createRoutes } from './routes/index.js';

export function createApp({ env, db, newAuthClient, publish = () => {} }) {
  const app = express();
  const auth = createAuth(db, env.jwtSecret);
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(cors({
    origin: (origin, callback) => callback(
      origin && !env.origins.includes(origin) ? new AppError(403, 'Origen no permitido') : null, true
    ),
    exposedHeaders: ['Content-Disposition']
  }));
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  const controllers = createControllers({ db, newAuthClient, auth, publish });
  app.use('/api', createRoutes(controllers, auth.authMiddleware));
  app.use((req, res, next) => next(new AppError(404, 'Ruta no encontrada')));
  app.use(errorHandler);
  return { app, auth };
}
