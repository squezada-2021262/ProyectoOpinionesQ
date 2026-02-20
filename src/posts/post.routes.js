'use strict';
import { Router } from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost } from './post.controller.js';
import { verifyToken } from '../../middlewares/validate-token.js';

const router = Router();

// GET /api/v1/posts → listar publicaciones (público)
router.get('/', getPosts);

// GET /api/v1/posts/:id → ver una publicación (público)
router.get('/:id', getPostById);

// Las siguientes rutas requieren autenticación
router.use(verifyToken);

// POST /api/v1/posts → crear publicación
router.post('/', createPost);

// PUT /api/v1/posts/:id → editar publicación (solo autor)
router.put('/:id', updatePost);

// DELETE /api/v1/posts/:id → eliminar publicación (solo autor)
router.delete('/:id', deletePost);

export default router;