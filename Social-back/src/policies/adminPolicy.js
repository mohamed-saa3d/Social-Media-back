export const canAccessAdmin = (user) => Boolean(user?.isAdmin);

export default { canAccessAdmin };
