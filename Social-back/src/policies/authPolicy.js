const toIdString = (value) => {
  if (value == null) return '';
  return typeof value.toString === 'function' ? value.toString() : String(value);
};

export const isOwner = ({ resource, resourceField = 'userId', userId }) => {
  return toIdString(resource?.[resourceField]) === toIdString(userId);
};

export const isOwnerOrAdmin = ({ resource, resourceField = 'userId', userId, isAdmin }) => {
  return isOwner({ resource, resourceField, userId }) || Boolean(isAdmin);
};

export default { isOwner, isOwnerOrAdmin };
