'use strict';
import Comment from './comment.model.js';
import Post from '../posts/post.model.js';

// GET /api/v1/comments/post/:postId → obtener comentarios de una publicación
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verificar que la publicación existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({ post: postId })
      .populate('author', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ post: postId });

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los comentarios',
      error: error.message,
    });
  }
};

// POST /api/v1/comments/post/:postId → agregar comentario a una publicación
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'El contenido del comentario es requerido',
      });
    }

    // Verificar que la publicación existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada',
      });
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
    });

    await comment.save();

    // Actualizar contador de comentarios en la publicación
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    await comment.populate('author', 'name username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear el comentario',
      error: error.message,
    });
  }
};

// PUT /api/v1/comments/:id → editar comentario (solo el autor)
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'El contenido es requerido',
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado',
      });
    }

    // Solo el autor puede editar
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este comentario',
      });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'name username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Comentario actualizado exitosamente',
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el comentario',
      error: error.message,
    });
  }
};

// DELETE /api/v1/comments/:id → eliminar comentario (solo el autor)
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado',
      });
    }

    // Solo el autor puede eliminar
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este comentario',
      });
    }

    const postId = comment.post;
    await Comment.findByIdAndDelete(id);

    // Decrementar contador en la publicación
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Comentario eliminado exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el comentario',
      error: error.message,
    });
  }
};