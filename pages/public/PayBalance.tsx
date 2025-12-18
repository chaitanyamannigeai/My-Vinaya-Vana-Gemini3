// PayBalance.tsx — Customer-facing balance payment page
// ------------------------------------------------------
// This page allows a guest to pay their remaining balance.
// It is linked from admin via: /pay-balance/:bookingId
// ------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { loadRazorpayScript } from "../../services/razorpay";

const PayBalance = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [b, s] = await Promise.all([
        api.bookings.getById(bookingId),
        api.settings.get(),
      ]);
      setBooking(b);
      setSettings(s || {});
      setLoading(false);
    };    
    load();
  }, [bookingId]);

  const handlePay = async () => {
    if (!booking) return;

    const amt = Number(booking.balanceAmount || 0);
    if (amt <= 0) return alert("No balance remaining");

    const isDummy = !settings.razorpayKey || settings.razorpayKey.includes("test");
    if (isDummy) return finalizePayment();

    const ok = await loadRazorpayScript();
    if (!ok) return alert("Payment SDK load error");

    const rzp = new window.Razorpay({
      key: settings.razorpayKey,
      amount: amt * 100,
      currency: "INR",
      name: "Vinaya Vana Farmhouse",
      description: "Balance Payment",

      prefill: {
        name: booking.guestName,
        contact: booking.guestPhone,
      },

      handler: () => finalizePayment(),
    });

    rzp.open();
  };

  const finalizePayment = async () => {
    const updated = {
      ...booking,
      amountPaid: Number(booking.amountPaid) + Number(booking.balanceAmount),
      balanceAmount: 0,
      status: "PAID",
    };

    await api.bookings.save(updated);
    setSuccess(true);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!booking) return <div className="p-10 text-center">Booking not found</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Balance Payment</h1>

      <div className="bg-white shadow rounded p-6 space-y-3">
        <p><strong>Guest:</strong> {booking.guestName}</p>
        <p><strong>Phone:</strong> {booking.guestPhone}</p>
        <p><strong>Total Amount:</strong> ₹{booking.totalAmount}</p>
        <p><strong>Paid:</strong> ₹{booking.amountPaid}</p>
        <p className="text-red-600 font-bold"><strong>Balance Due:</strong> ₹{booking.balanceAmount}</p>
      </div>

      {success ? (
        <div className="mt-6 bg-green-100 text-green-800 p-4 rounded text-center">
          Payment successful! Thank you.
        </div>
      ) : (
        <button
          onClick={handlePay}
          className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg"
        >
          Pay Balance (₹{booking.balanceAmount})
        </button>
      )}
    </div>
  );
};

export default PayBalance;
