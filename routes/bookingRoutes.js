//Third-Party modules
const express = require("express");

//Own Modules
const bookingController = require("../controllers/bookingsController");
const authController = require("../controllers/authController");

const bookingRouter = express.Router();
bookingRouter.get(
  "/checkout-session/:tourId",
  authController.protect,
  bookingController.getCheckoutSession
);

bookingRouter
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

bookingRouter
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
