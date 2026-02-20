'use strict';

import User from './user.model.js';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../middlewares/validate-token.js';

// ─── Helper: construir respuesta de usuario sin password ─────────────────────
const buildUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
};

// ─── Helper: asyncHandler inline ─────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/profile  → perfil del usuario autenticado
// ─────────────────────────────────────────────────────────────────────────────
export const getMyProfile = [
  verifyToken,
  asyncHandler(async (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: buildUserResponse(req.user),
    });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/:id  → perfil público de cualquier usuario
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = [
  verifyToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: buildUserResponse(user),
    });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/users/profile  → editar perfil propio
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyProfile = [
  verifyToken,
  asyncHandler(async (req, res) => {
    const { name, username, bio, profilePicture } = req.body;
    const userId = req.user._id;

    // Si cambia username verificar que no esté tomado
    if (username && username.toLowerCase() !== req.user.username) {
      const exists = await User.findOne({ username: username.toLowerCase() });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso',
        });
      }
    }

    const updateData = {};
    if (name !== undefined)           updateData.name = name;
    if (username !== undefined)       updateData.username = username.toLowerCase();
    if (bio !== undefined)            updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: buildUserResponse(user),
    });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/users/change-password  → cambiar contraseña (requiere la anterior)
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = [
  verifyToken,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual y la nueva son requeridas',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
    }

    // Obtener usuario con password incluido
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  }),
];

// NOTA: No existe endpoint de eliminación de perfiles
// para garantizar la integridad de opiniones y comentarios.