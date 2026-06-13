import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { validateFollowSelfReference } from '../validations/follow.validation.js';

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const buildFollowSnapshot = async (followerId, followingId) => {
  const [followerUser, followingUser] = await Promise.all([
    User.findById(followerId).select('_id username name avatar'),
    User.findById(followingId).select('_id username name avatar'),
  ]);

  return {
    follower: followerUser,
    following: followingUser,
  };
};

export const followUser = async ({ followerId, followingId }) => {
  if (!validateFollowSelfReference(followerId, followingId)) {
    throw new AppError(400, { error: 'You cannot follow yourself' });
  }

  const [followerUser, followingUser] = await Promise.all([
    User.findById(followerId),
    User.findById(followingId),
  ]);

  if (!followerUser || !followingUser) {
    throw new AppError(404, { error: 'User not found' });
  }

  const existing = await Follow.findOne({ followerId, followingId });
  if (existing) {
    return {
      followed: true,
      alreadyFollowing: true,
      follow: existing,
      ...(await buildFollowSnapshot(followerId, followingId)),
    };
  }

  const follow = await Follow.create({ followerId, followingId });

  return {
    followed: true,
    alreadyFollowing: false,
    follow,
    ...(await buildFollowSnapshot(followerId, followingId)),
  };
};

export const unfollowUser = async ({ followerId, followingId }) => {
  const result = await Follow.deleteOne({ followerId, followingId });

  return {
    unfollowed: true,
    deletedCount: result.deletedCount || 0,
  };
};

export const checkFollowStatus = async ({ followerId, followingId }) => {
  const follow = await Follow.findOne({ followerId, followingId }).select('_id followerId followingId createdAt');
  return {
    isFollowing: Boolean(follow),
    follow,
  };
};

export const getFollowersList = async ({ userId, query = {} }) => {
  const { page, limit, skip } = getPagination(query);

  const filter = { followingId: userId };
  const [totalCount, rows] = await Promise.all([
    Follow.countDocuments(filter),
    Follow.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('followerId', '_id username name avatar'),
  ]);

  return {
    data: rows.map((row) => row.followerId),
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };
};

export const getFollowingList = async ({ userId, query = {} }) => {
  const { page, limit, skip } = getPagination(query);

  const filter = { followerId: userId };
  const [totalCount, rows] = await Promise.all([
    Follow.countDocuments(filter),
    Follow.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('followingId', '_id username name avatar'),
  ]);

  return {
    data: rows.map((row) => row.followingId),
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };
};

export default {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowersList,
  getFollowingList,
};
