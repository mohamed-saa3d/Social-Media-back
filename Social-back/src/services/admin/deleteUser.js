import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Notification from '../../models/Notification.js';
import Session from '../../models/Session.js';
import { AppError } from '../../utils/appError.js';
import adminPolicy from '../../policies/admin.policy.js';

export default async function deleteUserAdmin({ targetUserId, requesterUserId, requesterIsAdmin }) {
  const [targetUser, adminCount] = await Promise.all([
    User.findById(targetUserId).select('isAdmin'),
    User.countDocuments({ isAdmin: true }),
  ]);

  if (!targetUser) {
    throw new AppError(404, { error: 'User not found' });
  }

  const decision = adminPolicy.canDeleteUserAsAdmin({
    requesterUserId,
    requesterIsAdmin,
    targetUserId,
    targetIsAdmin: Boolean(targetUser.isAdmin),
    adminCount,
  });
  if (!decision.allowed) {
    throw new AppError(403, { error: decision.reason });
  }

  await User.findByIdAndDelete(targetUserId);

  await Promise.all([
    Post.deleteMany({ userId: targetUserId }),
    Comment.deleteMany({ userId: targetUserId }),
    Notification.deleteMany({ $or: [{ actor: targetUserId }, { recipient: targetUserId }] }),
    Session.deleteMany({ userId: targetUserId }),
  ]);

  return { message: 'User deleted' };
}
