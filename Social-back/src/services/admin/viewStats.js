import User from '../../models/User.js';
import Post from '../../models/Post.js';
import { AppError } from '../../utils/appError.js';
import adminPolicy from '../../policies/admin.policy.js';

export default async function viewStats({ requesterIsAdmin }) {
  const decision = adminPolicy.canViewStats({ requesterIsAdmin });
  if (!decision.allowed) {
    throw new AppError(403, { error: decision.reason });
  }

  const users = await User.countDocuments();
  const posts = await Post.countDocuments();
  return { users, posts };
}
