import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Room, Booking, PaymentStatus } from '../../types';
import { CheckCircle, Users, Home, Utensils, Wifi, Monitor, Droplet, Calendar, XCircle, MessageCircle } from 'lucide-react';

const Accommodation = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    guestName: '',
    guestPhone: '',
    checkIn: '',
    checkOut: ''
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<{avgPrice: number, days: number} | null>(null);
  
  const settings = db.settings.get();

  useEffect(() => {
    const allRooms = db.rooms.getAll();
    setRooms(allRooms);
    if (allRooms.length > 0) {
      setBookingForm(prev => ({ ...prev, roomId: allRooms[0].id }));
      setSelectedRoom(allRooms[0]);
    }
  }, []);

  useEffect(() => {
    if (bookingForm.roomId) {
      const r = rooms.find(rm => rm.id === bookingForm.roomId);
      setSelectedRoom(r || null);
    }
  }, [bookingForm.roomId, rooms]);

  // Price Calculation & Availability Check
  useEffect(() => {
    setAvailabilityError(null);
    setPricingBreakdown(null);
    setTotalPrice(0);

    if (selectedRoom && bookingForm.checkIn && bookingForm.checkOut) {
      // Check basic date logic
      if (new Date(bookingForm.checkIn) >= new Date(bookingForm.checkOut)) {
          setAvailabilityError("Check-out must be after Check-in");
          return;
      }

      // 1. Availability Check
      const isAvailable = db.bookings.checkAvailability(
          selectedRoom.id, 
          bookingForm.checkIn, 
          bookingForm.checkOut
      );

      if (!isAvailable) {
          setAvailabilityError("Room is not available for these dates. Please choose different dates.");
          return;
      }

      // 2. Calculate Price with Seasonal Rules
      let calculatedTotal = 0;
      let currentDate = new Date(bookingForm.checkIn);
      const endDate = new Date(bookingForm.checkOut);
      let days = 0;

      while (currentDate < endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const multiplier = db.pricing.getMultiplierForDate(dateStr);
          calculatedTotal += (selectedRoom.basePrice * multiplier);
          
          days++;
          currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (days > 0) {
        setTotalPrice(Math.round(calculatedTotal));
        setPricingBreakdown({
            avgPrice: Math.round(calculatedTotal / days),
            days: days
        });
      }
    }
  }, [bookingForm.checkIn, bookingForm.checkOut, bookingForm.roomId, selectedRoom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || totalPrice <= 0 || availabilityError) return;
    setShowPayment(true);
  };

  const getWhatsAppBookingLink = () => {
      if (!selectedRoom) return '#';
      let msg = `Hi, I want to book ${selectedRoom.name}`;
      if (bookingForm.checkIn && bookingForm.checkOut) {
          msg += ` from ${bookingForm.checkIn} to ${bookingForm.checkOut}`;
      }
      if (totalPrice > 0) {
          msg += `. Estimated price seen on website: ₹${totalPrice}`;
      }
      return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const confirmPayment = () => {
    // Double check availability before confirming (race condition simulation)
    const isAvailable = db.bookings.checkAvailability(
        bookingForm.roomId, 
        bookingForm.checkIn, 
        bookingForm.checkOut
    );

    if (!isAvailable) {
        setShowPayment(false);
        setAvailabilityError("Sorry! Someone just booked these dates.");
        return;
    }

    // Simulate Razorpay success
    const newBooking: Booking = {
      id: Date.now().toString(),
      roomId: bookingForm.roomId,
      guestName: bookingForm.guestName,
      guestPhone: bookingForm.guestPhone,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      totalAmount: totalPrice,
      status: PaymentStatus.PAID,
      createdAt: new Date().toISOString()
    };

    db.bookings.add(newBooking);
    setShowPayment(false);
    setBookingSuccess(true);
    
    // Reset form
    setBookingForm({
      roomId: rooms[0]?.id || '',
      guestName: '',
      guestPhone: '',
      checkIn: '',
      checkOut: ''
    });
    setTotalPrice(0);
  };

  return (
    <div className="bg-nature-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-center text-nature-900 mb-12">Our Accommodation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Room Listings */}
          <div className="lg:col-span-2 space-y-12">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-nature-100">
                <div className="h-80 overflow-hidden">
                  <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-nature-800">{room.name}</h2>
                      <p className="text-nature-600 mt-2 flex items-center gap-2">
                        <Users size={18} /> Fits up to {room.capacity} guests
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-nature-700">₹{room.basePrice}</span>
                      <span className="text-gray-500 text-sm block">base / night</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">{room.description}</p>
                  
                  <div className="bg-nature-50 p-6 rounded-xl mb-6">
                    <h3 className="font-semibold text-nature-900 mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {room.amenities.map((am, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle size={16} className="text-nature-500" />
                          {am}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Property Details Icons for visual appeal */}
                   <div className="flex gap-4 border-t pt-4 text-gray-500 text-sm">
                      <div className="flex flex-col items-center gap-1"><Home size={20}/><span>2BHK</span></div>
                      <div className="flex flex-col items-center gap-1"><Utensils size={20}/><span>Kitchen</span></div>
                      <div className="flex flex-col items-center gap-1"><Droplet size={20}/><span>Geyser</span></div>
                      <div className="flex flex-col items-center gap-1"><Monitor size={20}/><span>TV</span></div>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl sticky top-24 border-t-4 border-nature-600">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="text-nature-600"/> Reserve Your Stay
              </h3>
              
              {bookingSuccess ? (
                <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <p className="font-bold text-xl">Booking Confirmed!</p>
                  <p className="text-sm mt-2">Thank you for choosing Vinaya Vana.</p>
                  <button 
                    onClick={() => setBookingSuccess(false)} 
                    className="mt-6 text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:shadow hover:bg-green-50 text-green-800 transition-all"
                  >
                      Book another room
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Room</label>
                    <select 
                      name="roomId" 
                      value={bookingForm.roomId} 
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500 focus:border-transparent"
                    >
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-In</label>
                      <input 
                        type="date" 
                        name="checkIn"
                        value={bookingForm.checkIn}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out</label>
                      <input 
                        type="date" 
                        name="checkOut"
                        value={bookingForm.checkOut}
                        onChange={handleInputChange}
                        required
                        min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      name="guestName"
                      value={bookingForm.guestName}
                      onChange={handleInputChange}
                      required
                      placeholder="John Doe"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      name="guestPhone"
                      value={bookingForm.guestPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500"
                    />
                  </div>

                  {/* Error Display */}
                  {availabilityError && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm flex items-start gap-2">
                          <XCircle size={18} className="mt-0.5 shrink-0"/>
                          <span>{availabilityError}</span>
                      </div>
                  )}

                  {/* Price Display */}
                  {totalPrice > 0 && !availabilityError && pricingBreakdown && (
                    <div className="bg-nature-50 p-4 rounded-lg border border-nature-200 mt-4 animate-fade-in">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{pricingBreakdown.days} Nights x Avg ₹{pricingBreakdown.avgPrice}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xl text-nature-900 pt-2 border-t border-nature-200">
                        <span>Total</span>
                        <span>₹{totalPrice}</span>
                      </div>
                      <p className="text-xs text-nature-500 mt-1 text-right italic">Includes seasonal pricing</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={!!availabilityError || totalPrice === 0}
                    className={`w-full font-bold py-3 rounded-lg transition-colors shadow-md mt-4 ${
                        availabilityError || totalPrice === 0 
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                        : 'bg-nature-600 hover:bg-nature-700 text-white'
                    }`}
                  >
                    {availabilityError ? 'Unavailable' : 'Book Now'}
                  </button>

                  {/* WhatsApp Alternative */}
                   <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <a 
                    href={getWhatsAppBookingLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
                  >
                    <MessageCircle size={20} />
                    Book via WhatsApp
                  </a>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mock Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center relative">
            <button onClick={() => setShowPayment(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <XCircle size={24}/>
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Payment</h3>
            <div className="bg-nature-50 py-4 rounded-lg mb-6">
                <p className="text-gray-600 text-sm">Amount Payable</p>
                <p className="text-3xl font-bold text-nature-700">₹{totalPrice}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 text-left">
              <p className="font-bold mb-1">Simulated Razorpay</p>
              <p>In a production environment, this would open the official Razorpay payment gateway using Key ID: <span className="font-mono bg-blue-100 px-1 rounded">{db.settings.get().razorpayKey}</span></p>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowPayment(false)} className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg w-1/3 font-medium">Cancel</button>
              <button onClick={confirmPayment} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg w-2/3 shadow-lg shadow-blue-200">Pay Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accommodation;