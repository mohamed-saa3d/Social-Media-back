import Post from '../../models/Post.js';
import Notification from '../../models/Notification.js';
import { cache } from '../../utils/cache.js';
import { AppError } from '../../utils/appError.js';

export default async function likePost({ postId, userId }) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  const alreadyLiked = post.likes.find((user) => user.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((user) => user.toString() !== userId);
  } else {
    post.likes.push(userId);
    if (post.userId.toString() !== userId) {
      try {
        await Notification.create({
          type: 'like',
          actor: userId,
          recipient: post.userId,
          post: post._id,
        });
      } catch (error) {
        // best-effort notification
      }
    }
  }

  await post.save();
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${post._id.toString()}`);
  return post;
}
