import Post from '../../models/Post.js';
import { cache } from '../../utils/cache.js';
import { AppError } from '../../utils/appError.js';

export default async function getPostById(postId) {
  const cacheKey = `posts:id:${postId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  cache.set(cacheKey, post, 300);
  return post;
}
