import mongoose from 'mongoose';

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const REPORT_TARGET_TYPES = ['post', 'user', 'comment'];

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'nudity',
  'violence',
  'scam',
  'impersonation',
  'copyright',
  'self_harm',
  'other',
];

export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved'];

export const normalizeReportDescription = (description) => {
  if (description === '') {
    return null;
  }

  return description ?? null;
};

