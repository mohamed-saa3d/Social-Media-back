import Comment from '../../models/Comment.js';
import Notification from '../../models/Notification.js';
import { cache } from '../../utils/cache.js';
import { AppError } from '../../utils/appError.js';
import { removeUploadedFile } from './shared.js';

export default async function deletePost(post) {
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  const postId = post._id;
  const imagePath = post.image;

  await post.deleteOne();
  await Promise.all([
    Comment.deleteMany({ $or: [{ postId }, { post: postId }] }),
    Notification.deleteMany({ post: postId }),
  ]);
  await removeUploadedFile(imagePath);
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${postId.toString()}`);

  return { message: 'Post deleted successfully' };
}
