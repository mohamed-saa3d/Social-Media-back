import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Post from '../models/Post.js';
import { AppError } from '../utils/appError.js';

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const hasForbiddenFields = (payload) => {
  const restrictedFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];
  return restrictedFields.some((field) => Object.prototype.hasOwnProperty.call(payload || {}, field));
};

export const createComment = async ({ postId, text, userId }) => {
  if (!postId || !text) {
    throw new AppError(400, { error: 'Missing fields' });
  }

  const comment = await Comment.create({ userId, postId, text });

  try {
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  } catch (error) {
    // best-effort
  }

  try {
    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== userId) {
      await Notification.create({
        type: 'comment',
        actor: userId,
        recipient: post.userId,
        comment: comment._id,
        post: postId,
      });
    }
  } catch (error) {
    // best-effort
  }

  return comment;
};

export const getCommentsByPost = async ({ postId, query = {} }) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { postId };
  const [totalCount, comments] = await Promise.all([
    Comment.countDocuments(filter),
    Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    data: comments,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };
};

export const getCommentById = async (commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError(404, { error: 'Comment not found' });
  }
  return comment;
};

export const updateComment = async (comment, payload) => {
  if (!comment) {
    throw new AppError(404, { error: 'Comment not found' });
  }

  if (hasForbiddenFields(payload)) {
    throw new AppError(400, { error: 'Attempt to update restricted fields' });
  }

  const { text } = payload || {};
  if (text !== undefined) {
    comment.text = text;
  }

  const updated = await comment.save();
  return updated;
};

export const deleteComment = async (comment) => {
  if (!comment) {
    throw new AppError(404, { error: 'Comment not found' });
  }

  await comment.deleteOne();

  try {
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });
  } catch (error) {
    // best-effort
  }

  return { message: 'Comment deleted successfully' };
};

export default {
  createComment,
  getCommentsByPost,
  getCommentById,
  updateComment,
  deleteComment,
};
