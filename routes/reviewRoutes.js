//Third-Party
const express = require("express");

//Own modules
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

//Route
const reviewRoute = express.Router({ mergeParams: true });
reviewRoute.use(authController.protect);
reviewRoute
  .route("/")
  .get(reviewController.getReviews)
  .post(
    authController.authorize("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
reviewRoute
  .route("/:id")
  .delete(authController.authorize("admin"), reviewController.deleteReview);
module.exports = reviewRoute;
