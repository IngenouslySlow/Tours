//Core
const crypto = require("crypto");
//Third-party
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
//Own Modules
const createAsync = require("../utils/createAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Email = require("../utils/sendMail");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  res.cookie("jwt", token, {
    httpOnly: true, //This is to protect from the cross site scripting attacks.
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    // secure: req.secure || req.get('x-forwarded-proto') === 'https',
  });
  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signUp = createAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get("host")}`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = createAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1.Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Invalid Email or Password", 401));
  }
  //2.check if the email and password matches
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid Email or Password", 401));
  }
  //3.Send the token
  createSendToken(user, 200, req, res);
});

//Protect Routes
exports.protect = createAsync(async (req, res, next) => {
  //1) Check if token is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );
  }
  //2) Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3) Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  }
  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again", 401)
    );
  }
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //2) Check if the user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      res.locals.user = currentUser; // req.locals is a property of the request object and can be accessed by template engine.
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//Authorize Routes
exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }
    next();
  };

//Forgot Password
exports.forgotPassword = createAsync(async (req, res, next) => {
  //1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/users/resetPassword/${resetToken}`;
  try {
    await new Email(user, resetURL).sendResetPassword();
    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // return next(
    //   new AppError("There was an error sending the email. Try again later", 500)
    // );
    res.status(500).json({
      status: "error",
      error: err,
    });
  }
});

exports.resetPassword = createAsync(async (req, res, next) => {
  //Hash the token
  const resetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  //Check if the user exists
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordCreatedAt: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  //Changing the passwordChangedAt field to the current time

  //Save the new password and issue the new token
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordCreatedAt = undefined;
  await user.save();

  //Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = createAsync(async (req, res, next) => {
  //We get the ID here because we have a middleware before this that gives us the ID.

  //Find the user
  const user = await User.findById(req.user.id).select("+password");

  //If the password matches then we can update the password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  //Updating the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //Sending back the response
  createSendToken(user, 200, req, res);
});

exports.deleteUser = createAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});
