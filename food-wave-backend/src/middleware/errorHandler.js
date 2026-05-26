const errorHandler = (err, req, res, next) => {
  console.error("BACKEND CRASH LOG:", err.stack); // This prints the real error to your terminal
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
};

module.exports = errorHandler;