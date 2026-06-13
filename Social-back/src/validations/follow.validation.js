import mongoose from 'mongoose';

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const validateFollowSelfReference = (followerId, followingId) => {
  if (!followerId || !followingId) {
    return true;
  }

  return followerId.toString() !== followingId.toString();
};

