import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

export const resourceLoaders = {
  User: (req) => User.findById(req.params.id),
  Post: (req) => Post.findById(req.params.id),
  Comment: (req) => Comment.findById(req.params.id),
};

export const getOwnerField = (resourceType) => {
  if (resourceType === 'User') return '_id';
  return 'userId';
};

export const resolveResource = async (req, getResource) => {
  if (typeof getResource === 'function') {
    return getResource(req);
  }

  if (typeof getResource === 'string') {
    const loader = resourceLoaders[getResource];
    if (!loader) return null;
    return loader(req);
  }

  return null;
};

export default { resourceLoaders, getOwnerField, resolveResource };
