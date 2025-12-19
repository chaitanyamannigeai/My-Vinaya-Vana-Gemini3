// pages/public/PayBalance.tsx
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import axios from 'axios';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { CheckCircle, AlertCircle, Loader, CreditCard } from 'lucide-react';

const { useParams } = ReactRouterDOM as any;

const PayBalance = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, s] = await Promise.all([
           axios.get(`/api/bookings/${bookingId}`),
           api.settings.get()
        ]);
        setBooking(bRes.data);
        setSettings(s);
      } catch (e) {
        setError("Invalid Booking ID or Network Error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!booking) return;

    const res = await loadRazorpayScript();
    if (!res) { alert('Razorpay failed to load'); return; }

    // Ensure phone number is valid for Razorpay (remove spaces/dashes)
    const cleanPhone = booking.guestPhone ? booking.guestPhone.replace(/[^0-9]/g, '') : '';

    const options = {
        key: settings.razorpayKey,
        amount: booking.balanceAmount * 100, // Amount in paise
        currency: 'INR',
        name: 'Vinaya Vana',
        description: `Balance Payment for Booking #${booking.id}`,
        // FIX: PREFILL DATA IS CRITICAL TO SKIP THE CONTACT POPUP
        prefill: { 
            name: booking.guestName,
            contact: cleanPhone, 
            email: settings.contactEmail // Fallback email if guest email isn't stored
        },
        theme: { color: '#3ba573' },
        handler: async function (response: any) {
             try {
                 await axios.post(`/api/bookings/${booking.id}/pay-balance`, {
                     amount: booking.balanceAmount,
                     paymentId: response.razorpay_payment_id
                 });
                 setSuccess(true);
             } catch (e) {
                 alert("Payment recorded failed on server, please contact admin.");
             }
        }
    };
    
    try {
        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) {
        console.error("Razorpay Error", err);
        alert("Payment Gateway Error. Please check console.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-green-600"/></div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-500 gap-2"><AlertCircle/> {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            {success ? (
                <div className="animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32}/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                    <p className="text-gray-500 mt-2">Your balance has been cleared.</p>
                </div>
            ) : (
                <>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Complete Your Payment</h1>
                    <p className="text-gray-500 text-sm mb-6">Booking for {booking.guestName}</p>
                    
                    <div className="bg-gray-100 p-4 rounded-xl mb-6 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Booking Cost</span>
                            <span className="font-medium">₹{booking.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Already Paid</span>
                            <span className="font-medium text-green-600">- ₹{booking.amountPaid}</span>
                        </div>
                        <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg text-gray-900">
                            <span>Balance Due</span>
                            <span>₹{booking.balanceAmount}</span>
                        </div>
                    </div>

                    {booking.balanceAmount <= 0 ? (
                        <div className="text-green-600 font-bold flex items-center justify-center gap-2">
                            <CheckCircle size={20}/> Fully Paid
                        </div>
                    ) : (
                        <button 
                            onClick={handlePayment}
                            className="w-full py-3 bg-nature-600 hover:bg-nature-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105"
                        >
                            <CreditCard size={20}/> Pay Balance ₹{booking.balanceAmount}
                        </button>
                    )}
                </>
            )}
       </div>
    </div>
  );
};

export default PayBalance;