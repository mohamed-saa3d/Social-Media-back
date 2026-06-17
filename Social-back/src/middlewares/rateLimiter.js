import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/* =========================================
   Generic Limiter
========================================= */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================================
   Login - Window Limit
   5 failed attempts / 10 minutes
========================================= */

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: ipKeyGenerator,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 10 minutes.',
  },
});

/* =========================================
   Register
   3 accounts / hour
========================================= */

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: ipKeyGenerator,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many accounts created from this IP. Try again in 1 hour.',
  },
});

/* =========================================
   Password Change
   3 changes / hour
========================================= */

export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,

  keyGenerator: (req) =>
    `${ipKeyGenerator(req)}_${req.user?.id ?? 'anon'}`,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many password change attempts. Try again in 1 hour.',
  },
});

/* =========================================
   Login Bruteforce Protection
   5 requests in 30 sec => block 1 hour
========================================= */

const loginBruteforceLimiter = new RateLimiterMemory({
  points: 5,
  duration: 30,
  blockDuration: 60 * 60,
});

export const loginBruteforceProtection = async (
  req,
  res,
  next
) => {
  try {
    await loginBruteforceLimiter.consume(req.ip);

    next();
  } catch {
    return res.status(429).json({
      success: false,
      message:
        'Too many rapid login attempts. IP blocked for 1 hour.',
    });
  }
};

export default limiter;