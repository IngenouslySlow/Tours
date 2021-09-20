//Third-Party modules
const express = require("express");

//Own Modules
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");
const reviewRouter = require("./reviewRoutes");

const tourRouter = express.Router();

//Param middleware
// tourRouter.param("id", tourController.checkID);
tourRouter
  .route("/tour-within/distance/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);
tourRouter
  .route("/distance/:latlng/unit/:unit")
  .get(tourController.getDistances);
tourRouter.use("/:tourId/reviews", reviewRouter);
tourRouter
  .route("/get-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter.route("/get-tour-stats").get(tourController.getTourStats);
tourRouter.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
tourRouter
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.authorize("admin"),
    tourController.checkBody,
    tourController.createTour
  );
tourRouter
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.authorize("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.authorize("admin"),
    tourController.deleteTour
  );
tourRouter
  .route("/:tourId/reviews")
  .get(
    authController.protect,
    authController.authorize("user"),
    reviewController.createReview
  );
module.exports = tourRouter;
