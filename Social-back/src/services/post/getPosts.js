import Post from '../../models/Post.js';
import { cache } from '../../utils/cache.js';
import { getPagination } from './shared.js';

export default async function getPosts(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const cacheKey = `posts:feed:page:${page}:limit:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const [totalCount, posts] = await Promise.all([
    Post.countDocuments(),
    Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const response = {
    data: posts,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };

  cache.set(cacheKey, response, 120);
  return response;
}
