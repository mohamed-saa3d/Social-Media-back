import { cache } from '../../utils/cache.js';
import { AppError } from '../../utils/appError.js';
import { hasForbiddenFields } from './shared.js';

export default async function updatePost(post, payload) {
  if (!post) {
    throw new AppError(404, { error: 'Post not found' });
  }

  if (hasForbiddenFields(payload)) {
    throw new AppError(400, { error: 'Attempt to update restricted fields' });
  }

  const { content, image, visibility } = payload || {};

  if (content !== undefined) {
    post.text = content;
  }
  if (image !== undefined) {
    post.image = image;
  }
  if (visibility !== undefined) {
    post.visibility = visibility;
  }

  const updated = await post.save();
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${post._id.toString()}`);
  return updated;
}
