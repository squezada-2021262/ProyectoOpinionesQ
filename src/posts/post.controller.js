'use strict';
import Post from './post.model.js';
import Comment from '../comments/comment.model.js';

// GET /api/v1/posts → listar todas las publicaciones con paginación
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, author } = req.query;
    const filter = {};

    if (category) filter.category = { $regex: category, $options: 'i' };
    if (author) filter.author = author;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(filter)
      .populate('author', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: posts,
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
      message: 'Error al obtener las publicaciones',
      error: error.message,
    });
  }
};

// GET /api/v1/posts/:id → obtener una publicación por ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate('author', 'name username profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la publicación',
      error: error.message,
    });
  }
};

// POST /api/v1/posts → crear publicación
export const createPost = async (req, res) => {
  try {
    const { title, category, content } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: 'El título, categoría y contenido son requeridos',
      });
    }

    const post = new Post({
      title,
      category,
      content,
      author: req.user._id,
    });

    await post.save();
    await post.populate('author', 'name username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear la publicación',
      error: error.message,
    });
  }
};

// PUT /api/v1/posts/:id → editar publicación (solo el autor)
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada',
      });
    }

    // Solo el autor puede editar
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta publicación',
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (content !== undefined) updateData.content = content;

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('author', 'name username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Publicación actualizada exitosamente',
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la publicación',
      error: error.message,
    });
  }
};

// DELETE /api/v1/posts/:id → eliminar publicación (solo el autor)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada',
      });
    }

    // Solo el autor puede eliminar
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta publicación',
      });
    }

    // Eliminar comentarios asociados a la publicación
    await Comment.deleteMany({ post: id });

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Publicación y sus comentarios eliminados exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la publicación',
      error: error.message,
    });
  }
};