'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';
import postRoutes from '../src/posts/post.routes.js';
import commentRoutes from '../src/comments/comment.routes.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors());
  app.use(helmet());
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = (app) => {
  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);
  app.use(`${BASE_PATH}/posts`, postRoutes);
  app.use(`${BASE_PATH}/comments`, commentRoutes);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      service: 'Proyecto GestionOpiniones Service',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Ruta no encontrada: ${req.originalUrl}`,
    });
  });
};

// Manejador global de errores
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const initServer = async () => {
  const app = express();
  const PORT = process.env.PORT || 3005;
  app.set('trust proxy', 1);

  try {
    await dbConnection();

    middlewares(app);
    routes(app);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('  SERVIDOR INICIADO CORRECTAMENTE');
      console.log('='.repeat(50));
      console.log(`  URL   : http://localhost:${PORT}`);
      console.log(`  SALUD : http://localhost:${PORT}${BASE_PATH}/health`);
      console.log('-'.repeat(50));
      console.log('  RUTAS DISPONIBLES');
      console.log('-'.repeat(50));
      console.log(`  [POST]   ${BASE_PATH}/auth/register`);
      console.log(`  [POST]   ${BASE_PATH}/auth/login`);
      console.log(`  [GET]    ${BASE_PATH}/users/profile`);
      console.log(`  [PUT]    ${BASE_PATH}/users/profile`);
      console.log(`  [PUT]    ${BASE_PATH}/users/change-password`);
      console.log(`  [GET]    ${BASE_PATH}/users/:id`);
      console.log(`  [GET]    ${BASE_PATH}/posts`);
      console.log(`  [GET]    ${BASE_PATH}/posts/:id`);
      console.log(`  [POST]   ${BASE_PATH}/posts`);
      console.log(`  [PUT]    ${BASE_PATH}/posts/:id`);
      console.log(`  [DELETE] ${BASE_PATH}/posts/:id`);
      console.log(`  [GET]    ${BASE_PATH}/comments/post/:postId`);
      console.log(`  [POST]   ${BASE_PATH}/comments/post/:postId`);
      console.log(`  [PUT]    ${BASE_PATH}/comments/:id`);
      console.log(`  [DELETE] ${BASE_PATH}/comments/:id`);
      console.log('='.repeat(50));
    });
  } catch (err) {
    console.error('='.repeat(50));
    console.error('  ERROR AL INICIAR EL SERVIDOR');
    console.error('='.repeat(50));
    console.error(`  Detalle: ${err.message}`);
    console.error('='.repeat(50));
    process.exit(1);
  }
};