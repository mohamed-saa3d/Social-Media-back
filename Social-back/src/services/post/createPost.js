import Post from '../../models/Post.js';
import { cache } from '../../utils/cache.js';

export default async function createPost({ userId, image, text }) {
  const newPost = new Post({ userId, image, text });
  await newPost.save();
  cache.delByPrefix('posts:feed');
  return newPost;
}
