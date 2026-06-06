import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js';
import { cache } from '../utils/cache.js';
import { AppError } from '../utils/appError.js';
import { ensureNotLastAdmin } from './adminService.js';

const restrictedFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];

export const getUserById = async (userId) => {
  const cacheKey = `users:profile:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError(404, { error: 'User not found' });
  }

  cache.set(cacheKey, user, 600);
  return user;
};

export const getMyProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError(404, { error: 'User not found' });
  }
  return user;
};

export const updateUser = async (user, payload) => {
  if (!user) {
    throw new AppError(404, { error: 'User not found' });
  }

  const hasForbiddenFields = restrictedFields.some((field) => Object.prototype.hasOwnProperty.call(payload || {}, field));
  if (hasForbiddenFields) {
    throw new AppError(400, { error: 'Attempt to update restricted fields' });
  }

  const { name, bio, avatar, location } = payload || {};

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (location !== undefined) user.location = location;

  const updated = await user.save();
  cache.del(`users:profile:${updated._id.toString()}`);
  return updated;
};

export const deleteUser = async (user) => {
  if (!user) {
    throw new AppError(404, { error: 'User not found' });
  }

  await ensureNotLastAdmin(user._id);

  const userId = user._id;
  await user.deleteOne();
  await Promise.all([
    Post.deleteMany({ userId }),
    Comment.deleteMany({ userId }),
    Notification.deleteMany({ $or: [{ actor: userId }, { recipient: userId }] }),
    Session.deleteMany({ userId }),
  ]);
  cache.del(`users:profile:${userId.toString()}`);

  return { message: 'User deleted successfully' };
};

export const followUser = async ({ targetUserId, followerUserId }) => {
  if (targetUserId === followerUserId) {
    throw new AppError(400, { message: 'You cannot follow yourself' });
  }

  const target = await User.findById(targetUserId);
  const actor = await User.findById(followerUserId);
  if (!target || !actor) {
    throw new AppError(404, { error: 'User not found' });
  }

  const alreadyFollowing = target.followers.find((user) => user.toString() === followerUserId);

  if (alreadyFollowing) {
    target.followers = target.followers.filter((user) => user.toString() !== followerUserId);
    actor.following = actor.following.filter((user) => user.toString() !== targetUserId);
  } else {
    target.followers.push(followerUserId);
    actor.following.push(targetUserId);

    try {
      await Notification.create({ type: 'follow', actor: followerUserId, recipient: targetUserId });
    } catch (error) {
      // best-effort notification
    }
  }

  await target.save();
  await actor.save();
  return { target, actor };
};

export default {
  getUserById,
  getMyProfile,
  updateUser,
  deleteUser,
  followUser,
};
