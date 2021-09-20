const express = require("express");
const viewController = require("../controllers/viewsControllers");
const authController = require("../controllers/authController");
const bookingController = require("../controllers/bookingsController");

const router = express.Router();

router.get(
  "/",
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.overview
);
router.get("/tour/:slug", authController.isLoggedIn, viewController.tour);
router.get("/login", authController.isLoggedIn, viewController.login);
router.get("/me", authController.protect, viewController.getAccount);
router.get("/my-tours", authController.protect, viewController.getMyTours);

module.exports = router;
