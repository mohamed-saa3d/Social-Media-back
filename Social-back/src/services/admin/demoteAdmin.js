import User from '../../models/User.js';
import { AppError } from '../../utils/appError.js';
import adminPolicy from '../../policies/admin.policy.js';

export default async function demoteAdmin({ targetUserId, requesterIsAdmin }) {
  const [targetUser, adminCount] = await Promise.all([
    User.findById(targetUserId).select('isAdmin'),
    User.countDocuments({ isAdmin: true }),
  ]);

  if (!targetUser) {
    throw new AppError(404, { error: 'User not found' });
  }

  const decision = adminPolicy.canDemoteAdmin({
    requesterIsAdmin,
    targetIsAdmin: Boolean(targetUser.isAdmin),
    adminCount,
  });
  if (!decision.allowed) {
    throw new AppError(403, { error: decision.reason });
  }

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { $set: { isAdmin: false } },
    { new: true },
  ).select('-password');

  return { message: 'Admin role removed successfully', user };
}
