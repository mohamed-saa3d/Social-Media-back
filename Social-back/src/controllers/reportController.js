import reportService from '../services/reportService.js';
import handleServiceError from '../utils/handleServiceError.js';

export const createReport = async (req, res) => {
  try {
    const result = await reportService.createReport({
      reporterId: req.userId,
      targetId: req.body.targetId,
      targetType: req.body.targetType,
      reason: req.body.reason,
      description: req.body.description,
    });
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const result = await reportService.updateReportStatus({
      reportId: req.params.id,
      status: req.body.status,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const listReports = async (req, res) => {
  try {
    const result = await reportService.listReports(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default {
  createReport,
  updateReportStatus,
  listReports,
};
