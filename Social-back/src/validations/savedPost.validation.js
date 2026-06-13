import mongoose from 'mongoose';

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

