'use strict';
import mongoose from 'mongoose';

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxLength: [200, 'El título no puede exceder 200 caracteres'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es requerida'],
      trim: true,
      maxLength: [100, 'La categoría no puede exceder 100 caracteres'],
    },
    content: {
      type: String,
      required: [true, 'El contenido es requerido'],
      trim: true,
      maxLength: [5000, 'El contenido no puede exceder 5000 caracteres'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El autor es requerido'],
    },
    // Contador de comentarios (desnormalizado para eficiencia)
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model('Post', postSchema);