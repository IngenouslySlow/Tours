// Third-party
const multer = require("multer");
const sharp = require("sharp");

//Own modules
const createAsync = require("../utils/createAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const factory = require("./factoryHandle");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image type. Please upload one", 404), false);
  }
};

const upload = multer({ storage, fileFilter });

exports.uploadUser = upload.single("photo");

exports.resizeUserPhoto = createAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//Functions
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

//User Handlers
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Internal server error.. Please try again",
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Internal server error.. Please try again",
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route will not exist.. Use /signup for creating an account.",
  });
};

exports.deleteUser = factory.deleteOne(User);

exports.updateMe = createAsync(async (req, res, next) => {
  // console.log(req.file);
  //1) Checking if the user entered password or passwordConfirm
  if (req.body.password || req.body.passwordConfirm)
    next(
      new AppError(
        "Passwords cannot be changed at this location, Please visit /updateMyPassword for changing your password",
        400
      )
    );
  //2) Filtering out the unwanted fields
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;
  //3) Updating the user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});
