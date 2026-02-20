'use strict';
import { Router } from 'express';
import {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
} from './comment.controller.js';
import { verifyToken } from '../../middlewares/validate-token.js';

const router = Router();

// GET /api/v1/comments/post/:postId → listar comentarios de una publicación (público)
router.get('/post/:postId', getCommentsByPost);

// Las siguientes rutas requieren autenticación
router.use(verifyToken);

// POST /api/v1/comments/post/:postId → comentar en una publicación
router.post('/post/:postId', createComment);

// PUT /api/v1/comments/:id → editar comentario (solo autor)
router.put('/:id', updateComment);

// DELETE /api/v1/comments/:id → eliminar comentario (solo autor)
router.delete('/:id', deleteComment);

export default router;