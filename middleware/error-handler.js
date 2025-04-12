import { createLogger } from '../utils/logger.js';

/**
 * Error handling middleware for Express in Lambda environment
 * Provides consistent error responses and logging
 */
export function errorHandler() {
  const logger = createLogger('error-handler');
  
  return (err, req, res, next) => {
    // Add request context to the log
    const requestContext = {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.get('X-Request-Id') || req.get('x-amzn-RequestId')
    };
    
    // Log the error with context
    logger.error('Request error', {
      error: err,
      request: requestContext,
      user: req.isAuthenticated() ? { id: req.user.id } : null
    });
    
    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Send appropriate response
    res.status(statusCode).json({
      error: {
        message: isProduction && statusCode === 500 ? 'Internal server error' : err.message,
        code: err.code || 'INTERNAL_ERROR',
        requestId: requestContext.requestId
      }
    });
  };
}
