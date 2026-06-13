import mediaService from '../services/mediaService.js';
import handleServiceError from '../utils/handleServiceError.js';

export const uploadMedia = async (req, res) => {
  try {
    const file = await mediaService.uploadMedia(req.file);
    return res.status(201).json(file);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
