/**
 * Logger utility for the Bills Generator application
 * Provides consistent logging with context for AWS Lambda environment
 */

/**
 * Creates a logger with the specified module name for context
 * @param {string} moduleName - The name of the module using this logger
 * @returns {Object} - Logger object with different log level methods
 */
export function createLogger(moduleName) {
  // Base context that will be included with all logs
  let context = {
    module: moduleName,
    timestamp: new Date().toISOString()
  };

  /**
   * Adds additional context to the logger
   * @param {Object} additionalContext - Additional context to add to logs
   * @returns {Object} - Logger with updated context
   */
  function addContext(additionalContext = {}) {
    context = { ...context, ...additionalContext };
    return logger;
  }

  /**
   * Formats the log message with context
   * @param {string} level - Log level (INFO, ERROR, etc.)
   * @param {string} message - Log message
   * @param {Object} [additionalData] - Additional data to include in the log
   * @returns {string} - Formatted log message
   */
  function formatLog(level, message, additionalData = {}) {
    const logData = {
      level,
      message,
      ...context,
      ...additionalData,
      timestamp: new Date().toISOString() // Always use current timestamp
    };
    
    // For Lambda, use JSON format for better CloudWatch integration
    return JSON.stringify(logData);
  }

  /**
   * Log at DEBUG level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to include
   */
  function debug(message, data = {}) {
    console.debug(formatLog('DEBUG', message, data));
    return logger;
  }

  /**
   * Log at INFO level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to include
   */
  function info(message, data = {}) {
    console.info(formatLog('INFO', message, data));
    return logger;
  }

  /**
   * Log at WARN level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to include
   */
  function warn(message, data = {}) {
    console.warn(formatLog('WARN', message, data));
    return logger;
  }

  /**
   * Log at ERROR level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to include
   */
  function error(message, data = {}) {
    // If data contains an error object, extract useful properties
    if (data.error instanceof Error) {
      const err = data.error;
      data = {
        ...data,
        errorMessage: err.message,
        errorName: err.name,
        stackTrace: err.stack
      };
      delete data.error; // Remove the original error object
    }
    console.error(formatLog('ERROR', message, data));
    return logger;
  }

  const logger = {
    addContext,
    debug,
    info,
    warn,
    error
  };

  return logger;
}
