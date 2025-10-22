/**
 * Async Error Handler Wrapper
 * Catches async errors and forwards them to error handling middleware
 */

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
