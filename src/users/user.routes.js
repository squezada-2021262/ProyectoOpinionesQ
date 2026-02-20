'use strict';
import { Router } from 'express';
import { getMyProfile, getUserById, updateMyProfile, changePassword } from './user.controller.js';
import { verifyToken } from '../../middlewares/validate-token.js';

const router = Router();

// Todas las rutas de usuario requieren autenticación
router.use(verifyToken);

// GET /api/v1/users/profile → perfil del usuario autenticado
router.get('/profile', getMyProfile);

// PUT /api/v1/users/profile → editar perfil (name, username, bio, profilePicture)
router.put('/profile', updateMyProfile);

// PUT /api/v1/users/change-password → cambiar contraseña
router.put('/change-password', changePassword);

// GET /api/v1/users/:id → ver perfil público de cualquier usuario
router.get('/:id', getUserById);

export default router;