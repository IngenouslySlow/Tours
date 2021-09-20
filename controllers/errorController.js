//Own modules
const AppError = require("../utils/appError");

const sendDevError = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(200).render("error", {
      title: "Something went wrong",
      message: err.message,
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value} `;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; //Getting the value of the duplicate field
  const message = `Duplicate field value: ${value}. Please use another value!`; //Creating a message
  return new AppError(message, 400); //Returning the error
};

const handleValidationErrorDB = (err) => {
  const values = Object.values(err.errors);
  const message = values.map((el) => el.message);
  return new AppError(message.join(". "), 400);
};

const sendProdError = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      message: err.message,
    });
  }
  return res.status(500).render("error", {
    title: "Something went wrong",
    message: "Please try again later",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.create(err); //Destructuring or creating a duplicate of the error object
    error.message = err.message; //Setting the message of the error
    if (error.name === "CastError") error = handleCastErrorDB(error); //Sending the error to the handleCastErrorDB function
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); //Sending the error to the handleDuplicateFieldsDB function
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError")
      error = new AppError("Invalid token", 401);
    if (error.name === "TokenExpiredError")
      error = new AppError("Token expired", 401);
    sendProdError(error, req, res);
  }
};
