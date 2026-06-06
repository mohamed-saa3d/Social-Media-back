import fs from 'fs/promises';
import path from 'path';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import { cache } from '../utils/cache.js';
import { AppError } from '../utils/appError.js';

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const removeUploadedFile = async (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  const baseName = path.basename(imagePath);
  const absolutePath = path.join(process.cwd(), 'uploads', baseName);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    // best-effort cleanup
  }
};

const hasForbiddenFields = (payload) => {
  const restrictedFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];
  return restrictedFields.some((field) => Object.prototype.hasOwnProperty.call(payload || {}, field));
};

export const createPost = async ({ userId, image, text }) => {
  const newPost = new Post({ userId, image, text });
  await newPost.save();
  cache.delByPrefix('posts:feed');
  return newPost;
};

export const likePost = async ({ postId, userId }) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  const alreadyLiked = post.likes.find((user) => user.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((user) => user.toString() !== userId);
  } else {
    post.likes.push(userId);
    if (post.userId.toString() !== userId) {
      try {
        await Notification.create({
          type: 'like',
          actor: userId,
          recipient: post.userId,
          post: post._id,
        });
      } catch (error) {
        // best-effort notification
      }
    }
  }

  await post.save();
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${post._id.toString()}`);
  return post;
};

export const getPosts = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const cacheKey = `posts:feed:page:${page}:limit:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const [totalCount, posts] = await Promise.all([
    Post.countDocuments(),
    Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const response = {
    data: posts,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };

  cache.set(cacheKey, response, 120);
  return response;
};

export const getPostById = async (postId) => {
  const cacheKey = `posts:id:${postId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  cache.set(cacheKey, post, 300);
  return post;
};

export const updatePost = async (post, payload) => {
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  if (hasForbiddenFields(payload)) {
    throw new AppError(400, { error: 'Attempt to update restricted fields' });
  }

  const { content, image, visibility } = payload || {};

  if (content !== undefined) {
    post.text = content;
  }
  if (image !== undefined) {
    post.image = image;
  }
  if (visibility !== undefined) {
    post.visibility = visibility;
  }

  const updated = await post.save();
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${post._id.toString()}`);
  return updated;
};

export const deletePost = async (post) => {
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  const postId = post._id;
  const imagePath = post.image;

  await post.deleteOne();
  await Promise.all([
    Comment.deleteMany({ $or: [{ postId }, { post: postId }] }),
    Notification.deleteMany({ post: postId }),
  ]);
  await removeUploadedFile(imagePath);
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${postId.toString()}`);

  return { message: 'Post deleted successfully' };
};

export default {
  createPost,
  likePost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};
