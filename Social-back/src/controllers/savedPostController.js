import savedPostService from '../services/savedPostService.js';
import handleServiceError from '../utils/handleServiceError.js';

export const savePost = async (req, res) => {
  try {
    const result = await savedPostService.savePost({
      userId: req.userId,
      postId: req.params.postId,
    });
    return res.status(result.alreadySaved ? 200 : 201).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const unsavePost = async (req, res) => {
  try {
    const result = await savedPostService.unsavePost({
      userId: req.userId,
      postId: req.params.postId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const result = await savedPostService.getSavedPosts({
      userId: req.userId,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default {
  savePost,
  unsavePost,
  getSavedPosts,
};
