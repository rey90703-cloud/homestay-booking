class ApiResponse {
  constructor(success, data, message = '', metadata = {}) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  static success(res, data, message = 'Success', statusCode = 200, metadata = {}) {
    return res.status(statusCode).json(new ApiResponse(true, data, message, metadata));
  }

  static error(res, message = 'Error', statusCode = 500, errors = []) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(errors.length > 0 && { details: errors }),
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  static created(res, data, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
