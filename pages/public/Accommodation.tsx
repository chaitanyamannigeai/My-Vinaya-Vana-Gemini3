import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, PaymentStatus, PricingRule } from '../../types';
import { CheckCircle, Users, Home, Utensils, Monitor, Droplet, Calendar as CalendarIcon, XCircle, MessageCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const { useLocation } = ReactRouterDOM as any;

// Declaration for Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

const Accommodation = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    guestName: '',
    guestPhone: '',
    checkIn: '',
    checkOut: ''
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showSimulatedPayment, setShowSimulatedPayment] = useState(false); // Renamed for clarity
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<{avgPrice: number, days: number, discountApplied: number} | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  
  // Router Location to get query params
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedRooms, fetchedSettings, fetchedRules, fetchedBookings] = await Promise.all([
            api.rooms.getAll(),
            api.settings.get(),
            api.pricing.getAll(),
            api.bookings.getAll()
        ]);
        
        setRooms(fetchedRooms);
        setSettings(fetchedSettings);
        setPricingRules(fetchedRules);
        setBookings(fetchedBookings);

        if (fetchedRooms.length > 0) {
            setBookingForm(prev => ({ ...prev, roomId: fetchedRooms[0].id }));
            setSelectedRoom(fetchedRooms[0]);
        }
        
        // Check for URL query parameter for date
        const params = new URLSearchParams(location.search);
        const dateParam = params.get('date');
        if (dateParam) {
            setBookingForm(prev => ({ ...prev, checkIn: dateParam }));
        }

      } catch (err) {
          console.error("Failed to load initial data", err);
      }
    };
    fetchData();
  }, [location.search]);

  useEffect(() => {
    if (bookingForm.roomId) {
      const r = rooms.find(rm => rm.id === bookingForm.roomId);
      setSelectedRoom(r || null);
    }
  }, [bookingForm.roomId, rooms]);

  // --- Availability Logic ---
  const checkAvailability = (roomId: string, checkIn: string, checkOut: string): boolean => {
      const start = new Date(checkIn).getTime();
      const end = new Date(checkOut).getTime();

      // Filter bookings for this room that are not FAILED
      const roomBookings = bookings.filter(b => b.roomId === roomId && b.status !== PaymentStatus.FAILED);

      for (const b of roomBookings) {
          const bStart = new Date(b.checkIn).getTime();
          const bEnd = new Date(b.checkOut).getTime();
          // Check overlap
          if (start < bEnd && end > bStart) {
              return false; 
          }
      }
      return true;
  };

  const getMultiplierForDate = (date: string): number => {
        const d = new Date(date).getTime();
        let maxMultiplier = 1;

        pricingRules.forEach(rule => {
            const start = new Date(rule.startDate).getTime();
            const end = new Date(rule.endDate).getTime();
            if (d >= start && d <= end) {
                if (rule.multiplier > maxMultiplier) {
                    maxMultiplier = rule.multiplier;
                }
            }
        });
        return maxMultiplier;
  };

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
      const isAvailable = checkAvailability(
          selectedRoom.id, 
          bookingForm.checkIn, 
          bookingForm.checkOut
      );

      if (!isAvailable) {
          setAvailabilityError("Selected dates are not available.");
          return;
      }

      // 2. Calculate Price with Seasonal Rules & Long Stay Discount
      let calculatedTotal = 0;
      let currentDate = new Date(bookingForm.checkIn);
      const endDate = new Date(bookingForm.checkOut);
      let days = 0;

      while (currentDate < endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const multiplier = getMultiplierForDate(dateStr);
          calculatedTotal += (selectedRoom.basePrice * multiplier);
          
          days++;
          currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (days > 0) {
        let discountAmount = 0;
        const discountSettings = settings.longStayDiscount;
        
        if (discountSettings && discountSettings.enabled && days >= discountSettings.minDays) {
            discountAmount = Math.round(calculatedTotal * (discountSettings.percentage / 100));
            calculatedTotal -= discountAmount;
        }

        setTotalPrice(Math.round(calculatedTotal));
        setPricingBreakdown({
            avgPrice: Math.round((calculatedTotal + discountAmount) / days),
            days: days,
            discountApplied: discountAmount
        });
      }
    }
  }, [bookingForm.checkIn, bookingForm.checkOut, bookingForm.roomId, selectedRoom, bookings, pricingRules, settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  // --- RAZORPAY INTEGRATION ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || totalPrice <= 0 || availabilityError) return;

    // 1. Check if we should use Real or Simulated payment
    const isDummyKey = !settings.razorpayKey || settings.razorpayKey === 'rzp_test_123456789' || settings.razorpayKey.includes('test_dummy');

    if (isDummyKey) {
        // Use Simulation Modal
        setShowSimulatedPayment(true);
    } else {
        // Use Real Razorpay
        const res = await loadRazorpayScript();
        if (!res) {
            alert('Razorpay SDK failed to load. Please check your internet connection.');
            return;
        }

        const options = {
            key: settings.razorpayKey,
            amount: totalPrice * 100, // Amount in paise
            currency: 'INR',
            name: 'Vinaya Vana Farmhouse',
            description: `Stay at ${selectedRoom.name} (${bookingForm.checkIn} to ${bookingForm.checkOut})`,
            image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=200', // Uses hero image styling
            prefill: {
                name: bookingForm.guestName,
                contact: bookingForm.guestPhone
            },
            theme: {
                color: '#3ba573'
            },
            handler: function (response: any) {
                // On Success
                finalizeBooking(response.razorpay_payment_id);
            },
            modal: {
                ondismiss: function() {
                    // console.log("Payment cancelled");
                }
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
    }
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

  const finalizeBooking = async (paymentId?: string) => {
    // Double check availability before confirming
    const isAvailable = checkAvailability(
        bookingForm.roomId, 
        bookingForm.checkIn, 
        bookingForm.checkOut
    );

    if (!isAvailable) {
        setShowSimulatedPayment(false);
        setAvailabilityError("Sorry! Someone just booked these dates.");
        return;
    }

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

    try {
        await api.bookings.add(newBooking);
        
        // Refresh bookings to update local state
        const updatedBookings = await api.bookings.getAll();
        setBookings(updatedBookings);

        setShowSimulatedPayment(false);
        setBookingSuccess(true);
        
        setBookingForm({
          roomId: rooms[0]?.id || '',
          guestName: '',
          guestPhone: '',
          checkIn: '',
          checkOut: ''
        });
        setTotalPrice(0);
    } catch (err) {
        alert("Booking failed to save. Please contact support.");
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const isDateBooked = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const currentRoomBookings = bookings.filter(b => b.roomId === bookingForm.roomId && b.status !== PaymentStatus.FAILED);

    return currentRoomBookings.some(b => {
      const start = new Date(b.checkIn).getTime();
      const end = new Date(b.checkOut).getTime(); 
      return target >= start && target < end; 
    });
  };

  const handleDateClick = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const date = new Date(year, month, day);
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset*60*1000));
    const dateStr = adjustedDate.toISOString().split('T')[0];

    if (isDateBooked(dateStr)) return; // Cannot click booked dates

    const currentIn = bookingForm.checkIn ? new Date(bookingForm.checkIn) : null;
    const currentOut = bookingForm.checkOut ? new Date(bookingForm.checkOut) : null;

    if (!currentIn || (currentIn && currentOut)) {
      setBookingForm(prev => ({ ...prev, checkIn: dateStr, checkOut: '' }));
    } else if (currentIn && !currentOut) {
      if (new Date(dateStr) > currentIn) {
        setBookingForm(prev => ({ ...prev, checkOut: dateStr }));
      } else {
        setBookingForm(prev => ({ ...prev, checkIn: dateStr, checkOut: '' }));
      }
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const offset = dateObj.getTimezoneOffset();
      const adjusted = new Date(dateObj.getTime() - (offset*60*1000));
      const dateStr = adjusted.toISOString().split('T')[0];
      
      const booked = isDateBooked(dateStr);
      const isPast = dateObj < today;
      
      const isCheckIn = bookingForm.checkIn === dateStr;
      const isCheckOut = bookingForm.checkOut === dateStr;
      const isInRange = bookingForm.checkIn && bookingForm.checkOut && 
                        dateStr > bookingForm.checkIn && dateStr < bookingForm.checkOut;

      let bgClass = "bg-white hover:bg-nature-50 text-gray-700 cursor-pointer";
      
      if (isPast) {
        bgClass = "bg-gray-100 text-gray-300 cursor-not-allowed";
      } else if (booked) {
        bgClass = "bg-red-50 text-red-300 cursor-not-allowed decoration-red-300"; 
      } else if (isCheckIn || isCheckOut) {
        bgClass = "bg-nature-600 text-white font-bold";
      } else if (isInRange) {
        bgClass = "bg-nature-100 text-nature-800";
      }

      days.push(
        <div 
          key={day}
          onClick={() => !isPast && !booked && handleDateClick(day)}
          className={`h-10 flex items-center justify-center text-sm rounded-md transition-colors ${bgClass}`}
          title={booked ? "Booked" : "Available"}
        >
          {day}
        </div>
      );
    }

    return days;
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
                  <CalendarIcon className="text-nature-600"/> Reserve Your Stay
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

                  {/* CALENDAR COMPONENT */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
                     <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={18}/></button>
                        <span className="font-bold text-gray-800">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={18}/></button>
                     </div>
                     <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                           <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>
                        ))}
                     </div>
                     <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                     </div>
                     <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border rounded"></span> Available</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-nature-600 rounded"></span> Selected</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded"></span> Booked</div>
                     </div>
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
                        readOnly 
                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-nature-500"
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
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-nature-500"
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

                  {/* Price Display & Awesome Discount Message */}
                  {totalPrice > 0 && !availabilityError && pricingBreakdown && (
                    <div className="bg-nature-50 p-4 rounded-lg border border-nature-200 mt-4 animate-fade-in">
                      
                      {/* AWESOME DISCOUNT CARD */}
                      {pricingBreakdown.discountApplied > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in relative overflow-hidden shadow-sm">
                            <div className="absolute -right-4 -top-4 bg-green-100 w-16 h-16 rounded-full opacity-50"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-nature-800 font-bold mb-2">
                                    <Sparkles size={18} className="text-yellow-500 fill-yellow-500 animate-pulse" />
                                    <span>You unlocked our Best Value Deal!</span>
                                </div>
                                <p className="text-xs text-nature-700 mb-3 leading-relaxed">
                                    Because you booked for <span className="font-bold text-nature-900">{pricingBreakdown.days} nights</span>, we've applied a special <span className="font-bold">{settings.longStayDiscount.percentage}%</span> long-stay discount just for you.
                                </p>
                                <div className="flex justify-between items-center bg-white/80 p-2 rounded border border-green-100">
                                    <span className="text-xs font-bold text-nature-600 uppercase tracking-wide">Total Savings</span>
                                    <span className="text-lg font-extrabold text-green-700">-₹{pricingBreakdown.discountApplied}</span>
                                </div>
                            </div>
                        </div>
                      )}

                      <div className="flex justify-between text-sm text-gray-600 mb-1 px-1">
                        <span>Stay Duration</span>
                        <span>{pricingBreakdown.days} Nights</span>
                      </div>

                      <div className="flex justify-between font-bold text-xl text-nature-900 pt-3 border-t border-nature-200 px-1">
                        <span>Final Total</span>
                        <span>₹{totalPrice}</span>
                      </div>
                      <p className="text-xs text-nature-500 mt-1 text-right italic">Includes taxes & fees</p>
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
                    {availabilityError ? 'Unavailable' : 'Pay & Book Now'}
                  </button>

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

      {/* Simulated Payment Modal (Only shown if Key is Dummy) */}
      {showSimulatedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center relative">
            <button onClick={() => setShowSimulatedPayment(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <XCircle size={24}/>
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Payment</h3>
            <div className="bg-nature-50 py-4 rounded-lg mb-6">
                <p className="text-gray-600 text-sm">Amount Payable</p>
                <p className="text-3xl font-bold text-nature-700">₹{totalPrice}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg mb-6 text-sm text-orange-800 text-left border border-orange-100">
              <p className="font-bold mb-1 flex items-center gap-2">
                 <span className="bg-orange-200 px-2 py-0.5 rounded text-xs uppercase">Simulation Mode</span>
              </p>
              <p className="mt-2">You are using a Test Key. No real money will be deducted. </p>
              <p className="mt-2 text-xs text-orange-600">To enable real payments, update the <strong>Razorpay Key ID</strong> in the Admin Panel.</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowSimulatedPayment(false)} className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg w-1/3 font-medium">Cancel</button>
              <button onClick={() => finalizeBooking()} className="px-6 py-3 bg-nature-600 hover:bg-nature-700 text-white font-bold rounded-lg w-2/3 shadow-lg">Simulate Success</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accommodation;