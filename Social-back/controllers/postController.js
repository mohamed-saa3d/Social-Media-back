import postService from '../src/services/postService.js';
import handleServiceError from '../src/utils/handleServiceError.js';

export const createPost = async (req, res) => {
  try {
    const post = await postService.createPost({
      userId: req.userId,
      image: req.body.image,
      text: req.body.text,
    });
    return res.status(201).json(post);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await postService.likePost({
      postId: req.params.id,
      userId: req.userId,
    });
    return res.status(200).json(post);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getPosts = async (req, res) => {
  try {
    const response = await postService.getPosts(req.query);
    return res.status(200).json(response);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    return res.status(200).json(post);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const updatePost = async (req, res) => {
  try {
    const updated = await postService.updatePost(req.resource, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const deletePost = async (req, res) => {
  try {
    const result = await postService.deletePost(req.resource);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
