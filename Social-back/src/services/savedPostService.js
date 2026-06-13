import SavedPost from '../models/SavedPost.js';
import Post from '../models/Post.js';
import { AppError } from '../utils/appError.js';

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const savePost = async ({ userId, postId }) => {
  const post = await Post.findById(postId).select('_id userId');
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  const existing = await SavedPost.findOne({ userId, postId });
  if (existing) {
    return {
      saved: true,
      alreadySaved: true,
      savedPost: existing,
    };
  }

  const savedPost = await SavedPost.create({ userId, postId });
  return {
    saved: true,
    alreadySaved: false,
    savedPost,
  };
};

export const unsavePost = async ({ userId, postId }) => {
  const result = await SavedPost.deleteOne({ userId, postId });
  return {
    unsaved: true,
    deletedCount: result.deletedCount || 0,
  };
};

export const getSavedPosts = async ({ userId, query = {} }) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { userId };

  const [totalCount, rows] = await Promise.all([
    SavedPost.countDocuments(filter),
    SavedPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postId'),
  ]);

  return {
    data: rows.map((row) => row.postId),
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };
};

export default {
  savePost,
  unsavePost,
  getSavedPosts,
};
