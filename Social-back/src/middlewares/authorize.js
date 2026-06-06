import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const toIdString = (value) => {
  if (value == null) return '';
  return typeof value.toString === 'function' ? value.toString() : String(value);
};

const resourceLoaders = {
  User: (req) => User.findById(req.params.id),
  Post: (req) => Post.findById(req.params.id),
  Comment: (req) => Comment.findById(req.params.id),
};

const getOwnerField = (resourceType) => {
  if (resourceType === 'User') return '_id';
  return 'userId';
};

const resolveResource = async (req, getResource) => {
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

export const adminOnly = (req, res, next) => {
  if (!req.userIsAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

export const ownerOrAdmin = (getResource) => {
  return async (req, res, next) => {
    try {
      const resource = await resolveResource(req, getResource);
      if (!resource) {
        return res.status(404).json({ error: 'Not found' });
      }

      const resourceField = typeof getResource === 'string' ? getOwnerField(getResource) : 'userId';
      const resourceUserId = toIdString(resource[resourceField]);
      const requesterId = toIdString(req.userId);
      if (resourceUserId !== requesterId && !req.userIsAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.resource = resource;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const ownerOnly = (getResource) => {
  return async (req, res, next) => {
    try {
      const resource = await resolveResource(req, getResource);
      if (!resource) {
        return res.status(404).json({ error: 'Not found' });
      }

      const resourceField = typeof getResource === 'string' ? getOwnerField(getResource) : 'userId';
      const resourceUserId = toIdString(resource[resourceField]);
      const requesterId = toIdString(req.userId);
      if (resourceUserId !== requesterId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.resource = resource;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default { adminOnly, ownerOrAdmin, ownerOnly };
