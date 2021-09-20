//Core
const path = require("path");
//Third-Party modules
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const csp = require("express-csp");
const compression = require("compression");
const app = express();
//Own Modules
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");

//Middleware
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
//Security Headers -- Helmet
app.use(helmet({ contentSecurityPolicy: false }));
csp.extend(app, {
  policy: {
    directives: {
      "default-src": ["self"],
      "style-src": ["self", "unsafe-inline", "https:"],
      "font-src": ["self", "https://fonts.gstatic.com"],
      "script-src": [
        "self",
        "unsafe-inline",
        "data",
        "blob",
        "https://js.stripe.com",
        "https://*.mapbox.com",
        "https://*.cloudflare.com/",
        "https://bundle.js:8828",
        "ws://localhost:56558/",
        "http://127.0.0.1:3000/api/v1/bookings/checkout-session/5c88fa8cf4afda39709c295a",
      ],
      "worker-src": [
        "self",
        "unsafe-inline",
        "data:",
        "blob:",
        "https://*.stripe.com",
        "https://*.mapbox.com",
        "https://*.cloudflare.com/",
        "https://bundle.js:*",
        "ws://localhost:*/",
      ],
      "frame-src": [
        "self",
        "unsafe-inline",
        "data:",
        "blob:",
        "https://*.stripe.com",
        "https://*.mapbox.com",
        "https://*.cloudflare.com/",
        "https://bundle.js:*",
        "ws://localhost:*/",
      ],
      "img-src": [
        "self",
        "unsafe-inline",
        "data:",
        "blob:",
        "https://*.stripe.com",
        "https://*.mapbox.com",
        "https://*.cloudflare.com/",
        "https://bundle.js:*",
        "ws://localhost:*/",
      ],
      "connect-src": [
        "self",
        "unsafe-inline",
        "data:",
        "blob:",
        "https://*.stripe.com",
        "https://*.mapbox.com",
        "https://*.cloudflare.com/",
        "https://bundle.js:*",
        "ws://localhost:*/",
        "http://127.0.0.1:3000/api/v1/bookings/checkout-session/5c88fa8cf4afda39709c295a",
      ],
    },
  },
});

//Body-Parser -- JSON
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

//Morgan for development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Limit too many requests from same IP
//Limiter
const limiter = rateLimit({
  max: 100, //max requests
  windowMs: 60 * 60 * 1000, //1 hour windowMs
});
app.use("/api", limiter);

//Sanitization for NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());
app.use(compression());
//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "rating",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);
app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

//Middlewares
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

//Unhandled Routes
app.all("*", (req, res, next) => {
  // const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
  // err.statusCode = 404;
  // next(err);
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

//Error handler
app.use(globalErrorHandler);
module.exports = app;
