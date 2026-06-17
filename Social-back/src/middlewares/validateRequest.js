import { validationResult, matchedData } from 'express-validator';

export default function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Apply sanitized/matched data back to req.body for downstream code
  try {
    const sanitized = matchedData(req, { locations: ['body'], includeOptionals: true });
    // Merge sanitized values onto req.body while preserving other non-body properties
    req.body = Object.assign({}, req.body || {}, sanitized);
  } catch (e) {
    // If matchedData fails for any reason, continue without blocking request
    // Logging via console to avoid importing logger here (non-critical)
    // This keeps behavior non-breaking while improving normalization in normal cases
    // eslint-disable-next-line no-console
    console.warn('validateRequest: matchedData failed:', e && e.message ? e.message : String(e));
  }

  next();
}
