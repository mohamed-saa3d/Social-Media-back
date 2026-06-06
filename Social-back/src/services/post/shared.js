import fs from 'fs/promises';
import path from 'path';

export const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const removeUploadedFile = async (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  const baseName = path.basename(imagePath);
  const absolutePath = path.join(process.cwd(), 'uploads', baseName);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    // best-effort cleanup
  }
};

export const hasForbiddenFields = (payload) => {
  const restrictedFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];
  return restrictedFields.some((field) => Object.prototype.hasOwnProperty.call(payload || {}, field));
};
