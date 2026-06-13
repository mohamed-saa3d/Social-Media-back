import followService from '../services/followService.js';
import handleServiceError from '../utils/handleServiceError.js';

export const followUser = async (req, res) => {
  try {
    const result = await followService.followUser({
      followerId: req.userId,
      followingId: req.params.userId,
    });
    return res.status(result.alreadyFollowing ? 200 : 201).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const result = await followService.unfollowUser({
      followerId: req.userId,
      followingId: req.params.userId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getFollowers = async (req, res) => {
  try {
    const result = await followService.getFollowersList({
      userId: req.params.userId,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getFollowing = async (req, res) => {
  try {
    const result = await followService.getFollowingList({
      userId: req.params.userId,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
