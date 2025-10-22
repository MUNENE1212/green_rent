/**
 * Standardized API Response Utility
 */

class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Success message
   * @param {Object} data - Response data
   */
  static success(res, statusCode = 200, message = 'Success', data = null) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Error message
   * @param {Object} errors - Detailed errors
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    const response = {
      success: false,
      error: {
        message,
        code: statusCode
      },
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.error.details = errors;
    }

    // Don't send stack trace in production
    if (process.env.NODE_ENV === 'development' && errors?.stack) {
      response.error.stack = errors.stack;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code
   * @param {String} message - Success message
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination info
   */
  static paginated(res, statusCode = 200, message = 'Success', data = [], pagination = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || data.length,
        itemsPerPage: pagination.itemsPerPage || data.length,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   */
  static validationError(res, errors = []) {
    return res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 422,
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      error: {
        message,
        code: 401
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      error: {
        message,
        code: 403
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      error: {
        message,
        code: 404
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default ApiResponse;
