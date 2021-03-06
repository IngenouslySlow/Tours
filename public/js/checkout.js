/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    "pk_test_51JbJXmSBgzl8mwa7LtnSZnVKhhWA9EIGA3hyDUZ3q4IZ6mjDmCGI0FXuHcOkt6MKT45pUxG34MT6a9Mb8q9QFCXi00xDtrJEwI"
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
