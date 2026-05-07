import rateLimit from 'express-rate-limit';

const rateLimitError = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests, please try again later.',
  },
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError,
});
