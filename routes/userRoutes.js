//Third-party
const express = require("express");

const userRouter = express.Router();

//Own modules
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

//User routes
userRouter.post("/signup", authController.signUp);
userRouter.post("/login", authController.login);
userRouter.get("/logout", authController.logout);
userRouter.post("/forgotPassword", authController.forgotPassword);
userRouter.patch("/resetPassword/:token", authController.resetPassword);
userRouter.use(authController.protect);
userRouter.get("/me", userController.getMe, userController.getUser);
userRouter.patch(
  "/updateMe",
  userController.uploadUser,
  userController.resizeUserPhoto,
  userController.updateMe
);
userRouter.patch("/updatePassword", authController.updatePassword);
userRouter.route("/").get(userController.getAllUsers);
userRouter.use(authController.authorize("admin"));
userRouter
  .route("/:id")
  .get(userController.getUser)
  .post(userController.createUser)
  .patch(userController.updateUser)
  .delete(
    authController.protect,
    authController.authorize("admin"),
    userController.deleteUser
  );

module.exports = userRouter;
