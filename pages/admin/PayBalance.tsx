import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";

const PayBalance = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [b, s] = await Promise.all([
          api.bookings.getById(bookingId),
          api.settings.get(),
        ]);

        setBooking(b);
        setSettings(s || {});
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    load();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking) return;

    const balance = Number(booking.balance_amount || 0);
    if (balance <= 0) return alert("No balance remaining.");

    const isTestKey =
      !settings.razorpayKey ||
      settings.razorpayKey.toLowerCase().includes("test");

    if (isTestKey) {
      return finalizePayment();
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      const rzp = new window.Razorpay({
        key: settings.razorpayKey,
        amount: balance * 100,
        currency: "INR",
        name: "Vinaya Vana",
        description: "Balance Payment",

        handler: function () {
          finalizePayment();
        },
      });

      rzp.open();
    };

    document.body.appendChild(script);
  };

  const finalizePayment = async () => {
    try {
      await api.bookings.save({
        ...booking,
        amount_paid:
          Number(booking.amount_paid || 0) +
          Number(booking.balance_amount || 0),
        balance_amount: 0,
        status: "PAID",
      });

      setSuccess(true);
    } catch (e) {
      alert("Error updating booking");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!booking) return <div className="p-10 text-center">Booking not found</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Pay Balance</h1>

      <div className="bg-white shadow rounded p-6 space-y-3">
        <p><strong>Name:</strong> {booking.guest_name}</p>
        <p><strong>Phone:</strong> {booking.guest_phone}</p>
        <p><strong>Total:</strong> ₹{booking.total_amount}</p>
        <p><strong>Paid:</strong> ₹{booking.amount_paid}</p>
        <p className="text-red-600 font-bold">
          <strong>Balance Due:</strong> ₹{booking.balance_amount}
        </p>
      </div>

      {success ? (
        <div className="mt-6 bg-green-100 text-green-700 p-4 text-center rounded">
          Payment Successful!
        </div>
      ) : (
        <button
          onClick={handlePayment}
          className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded"
        >
          Pay ₹{booking.balance_amount}
        </button>
      )}
    </div>
  );
};

export default PayBalance;
