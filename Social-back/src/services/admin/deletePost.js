import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Notification from '../../models/Notification.js';
import { AppError } from '../../utils/appError.js';
import adminPolicy from '../../policies/admin.policy.js';

export default async function deletePostAdmin({ postId, requesterIsAdmin }) {
  const decision = adminPolicy.canDeletePostAsAdmin({ requesterIsAdmin });
  if (!decision.allowed) {
    throw new AppError(403, { error: decision.reason });
  }

  const deleted = await Post.findByIdAndDelete(postId);
  if (!deleted) {
    throw new AppError(404, { error: 'Post not found' });
  }

  await Promise.all([
    Comment.deleteMany({ $or: [{ postId }, { post: postId }] }),
    Notification.deleteMany({ post: postId }),
  ]);

  return { message: 'Post deleted' };
}
