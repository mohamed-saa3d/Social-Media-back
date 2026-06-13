import adminPolicy from '../policies/adminPolicy.js';
import authPolicy from '../policies/authPolicy.js';
import postPolicy from '../policies/postPolicy.js';

export const adminOnly = (req, res, next) => {
  if (!adminPolicy.canAccessAdmin({ isAdmin: req.userIsAdmin })) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

export const ownerOrAdmin = (getResource) => {
  return async (req, res, next) => {
    try {
      const resource = await postPolicy.resolveResource(req, getResource);
      if (!resource) {
        return res.status(404).json({ error: 'Not found' });
      }

      const resourceField = typeof getResource === 'string'
        ? postPolicy.getOwnerField(getResource)
        : 'userId';

      if (!authPolicy.isOwnerOrAdmin({
        resource,
        resourceField,
        userId: req.userId,
        isAdmin: req.userIsAdmin,
      })) {
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
      const resource = await postPolicy.resolveResource(req, getResource);
      if (!resource) {
        return res.status(404).json({ error: 'Not found' });
      }

      const resourceField = typeof getResource === 'string'
        ? postPolicy.getOwnerField(getResource)
        : 'userId';

      if (!authPolicy.isOwner({
        resource,
        resourceField,
        userId: req.userId,
      })) {
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
