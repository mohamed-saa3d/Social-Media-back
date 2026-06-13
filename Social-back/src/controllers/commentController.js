import commentService from '../services/commentService.js';
import handleServiceError from '../utils/handleServiceError.js';

export const createComment = async (req, res) => {
  try {
    const comment = await commentService.createComment({
      postId: req.body.postId,
      text: req.body.text,
      userId: req.userId,
    });
    return res.status(201).json(comment);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const response = await commentService.getCommentsByPost({
      postId: req.params.postId,
      query: req.query,
    });

    return res.status(200).json(response);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getCommentById = async (req, res) => {
  try {
    const comment = await commentService.getCommentById(req.params.id);
    return res.status(200).json(comment);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const updateComment = async (req, res) => {
  try {
    const updated = await commentService.updateComment(req.resource, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const deleteComment = async (req, res) => {
  try {
    const result = await commentService.deleteComment(req.resource);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
