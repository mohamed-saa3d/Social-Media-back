import Report from '../models/Report.js';
import { AppError } from '../utils/appError.js';
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  normalizeReportDescription,
} from '../validations/report.validation.js';

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const buildReportFilter = (query = {}) => {
  const filter = {};

  if (query.status) {
    if (!REPORT_STATUSES.includes(query.status)) {
      throw new AppError(400, { error: 'Invalid report status' });
    }
    filter.status = query.status;
  }

  if (query.targetType) {
    if (!REPORT_TARGET_TYPES.includes(query.targetType)) {
      throw new AppError(400, { error: 'Invalid report target type' });
    }
    filter.targetType = query.targetType;
  }

  if (query.reporterId) {
    filter.reporterId = query.reporterId;
  }

  return filter;
};

export const createReport = async ({ reporterId, targetId, targetType, reason, description }) => {
  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    throw new AppError(400, { error: 'Invalid report target type' });
  }

  if (!REPORT_REASONS.includes(reason)) {
    throw new AppError(400, { error: 'Invalid report reason' });
  }

  const normalizedDescription = normalizeReportDescription(description);

  const existing = await Report.findOne({ reporterId, targetType, targetId });
  if (existing) {
    return {
      created: false,
      duplicate: true,
      report: existing,
    };
  }

  const report = await Report.create({
    reporterId,
    targetId,
    targetType,
    reason,
    description: normalizedDescription,
  });

  return {
    created: true,
    duplicate: false,
    report,
  };
};

export const updateReportStatus = async ({ reportId, status }) => {
  if (!REPORT_STATUSES.includes(status)) {
    throw new AppError(400, { error: 'Invalid report status' });
  }

  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError(404, { error: 'Report not found' });
  }

  report.status = status;
  const updated = await report.save();

  return updated;
};

export const listReports = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildReportFilter(query);

  const [totalCount, reports] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reporterId', '_id username name avatar'),
  ]);

  return {
    data: reports,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };
};

export default {
  createReport,
  updateReportStatus,
  listReports,
};
