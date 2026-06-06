import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js';
import { AppError } from '../utils/appError.js';

export const ensureNotLastAdmin = async (userId) => {
  const [adminCount, targetUser] = await Promise.all([
    User.countDocuments({ isAdmin: true }),
    User.findById(userId).select('isAdmin'),
  ]);

  if (!targetUser) {
    return;
  }

  if (targetUser.isAdmin && adminCount <= 1) {
    throw new AppError(403, {
      message: 'Cannot delete the last admin account. Promote another user to admin first.',
    });
  }
};

export const deleteUserAdmin = async ({ targetUserId, requesterUserId, requesterIsAdmin }) => {
  if (requesterIsAdmin && requesterUserId && requesterUserId.toString() === targetUserId.toString()) {
    throw new AppError(403, { error: 'Admin cannot delete his own account' });
  }

  await ensureNotLastAdmin(targetUserId);

  const deleted = await User.findByIdAndDelete(targetUserId);
  if (!deleted) {
    throw new AppError(404, { error: 'User not found' });
  }

  await Promise.all([
    Post.deleteMany({ userId: targetUserId }),
    Comment.deleteMany({ userId: targetUserId }),
    Notification.deleteMany({ $or: [{ actor: targetUserId }, { recipient: targetUserId }] }),
    Session.deleteMany({ userId: targetUserId }),
  ]);

  return { message: 'User deleted' };
};

export const deletePostAdmin = async (postId) => {
  const deleted = await Post.findByIdAndDelete(postId);
  if (!deleted) {
    throw new AppError(404, { error: 'Post not found' });
  }

  await Promise.all([
    Comment.deleteMany({ $or: [{ postId }, { post: postId }] }),
    Notification.deleteMany({ post: postId }),
  ]);

  return { message: 'Post deleted' };
};

export const viewStats = async () => {
  const users = await User.countDocuments();
  const posts = await Post.countDocuments();
  return { users, posts };
};

export const demoteAdmin = async (userId) => {
  await ensureNotLastAdmin(userId);

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isAdmin: false } },
    { new: true },
  ).select('-password');

  if (!user) {
    throw new AppError(404, { error: 'User not found' });
  }

  return { message: 'Admin role removed successfully', user };
};

export const getAllUsersAdmin = async () => {
  return User.find().select('-password').sort({ createdAt: -1 });
};

export default {
  ensureNotLastAdmin,
  deleteUserAdmin,
  deletePostAdmin,
  viewStats,
  demoteAdmin,
  getAllUsersAdmin,
};
