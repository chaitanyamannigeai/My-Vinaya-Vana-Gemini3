import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, PaymentStatus, PricingRule } from '../../types';
import { CheckCircle, Users, Home, Utensils, Monitor, Droplet, Calendar as CalendarIcon, XCircle, MessageCircle, ChevronLeft, ChevronRight, Sparkles, Wifi, Wind, Car, Coffee, Tv, waves, Sun } from 'lucide-react';

const { useLocation } = ReactRouterDOM as any;

// Declaration for Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

// --- HELPER: Amenity Icon Mapper ---
const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('net')) return <Wifi size={16} />;
    if (lower.includes('ac') || lower.includes('air')) return <Wind size={16} />;
    if (lower.includes('tv') || lower.includes('entertainment')) return <Tv size={16} />;
    if (lower.includes('kitchen') || lower.includes('cooking')) return <Utensils size={16} />;
    if (lower.includes('car') || lower.includes('parking')) return <Car size={16} />;
    if (lower.includes('geyser') || lower.includes('hot')) return <Droplet size={16} />;
    if (lower.includes('coffee') || lower.includes('tea')) return <Coffee size={16} />;
    if (lower.includes('view') || lower.includes('balcony')) return <Sun size={16} />;
    return <CheckCircle size={16} />; // Default icon
};

// --- SUB-COMPONENT: Room Image Carousel ---
const RoomCarousel = ({ images, name }: { images: string[], name: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="relative h-64 sm:h-72 overflow-hidden group">
            <img 
                src={images[currentIndex]} 
                alt={`${name} view ${currentIndex + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            
            {/* Navigation Arrows (Only if more than 1 image) */}
            {images.length > 1 && (
                <>
                    <button 
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full shadow-sm ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

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
  const [showSimulatedPayment, setShowSimulatedPayment] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [pricingBreakdown, setPricingBreakdown] = useState<{avgPrice: number, days: number, discountApplied: number} | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  
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

  // --- Helpers for Booking ---
  const handleSelectRoom = (roomId: string) => {
      setBookingForm(prev => ({ ...prev, roomId }));
      // Scroll to booking form smoothly
      document.getElementById('booking-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const checkAvailability = (roomId: string, checkIn: string, checkOut: string): boolean => {
      const start = new Date(checkIn).getTime();
      const end = new Date(checkOut).getTime();
      const roomBookings = bookings.filter(b => b.roomId === roomId && b.status !== PaymentStatus.FAILED);

      for (const b of roomBookings) {
          const bStart = new Date(b.checkIn).getTime();
          const bEnd = new Date(b.checkOut).getTime();
          if (start < bEnd && end > bStart) return false; 
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
                if (rule.multiplier > maxMultiplier) maxMultiplier = rule.multiplier;
            }
        });
        return maxMultiplier;
  };

  useEffect(() => {
    setAvailabilityError(null);
    setPricingBreakdown(null);
    setTotalPrice(0);

    if (selectedRoom && bookingForm.checkIn && bookingForm.checkOut) {
      if (new Date(bookingForm.checkIn) >= new Date(bookingForm.checkOut)) {
          setAvailabilityError("Check-out must be after Check-in");
          return;
      }

      const isAvailable = checkAvailability(selectedRoom.id, bookingForm.checkIn, bookingForm.checkOut);
      if (!isAvailable) {
          setAvailabilityError("Selected dates are not available.");
          return;
      }

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

    const isDummyKey = !settings.razorpayKey || settings.razorpayKey === 'rzp_test_123456789' || settings.razorpayKey.includes('test_dummy');

    if (isDummyKey) {
        setShowSimulatedPayment(true);
    } else {
        const res = await loadRazorpayScript();
        if (!res) { alert('Razorpay SDK failed to load.'); return; }

        const options = {
            key: settings.razorpayKey,
            amount: totalPrice * 100,
            currency: 'INR',
            name: 'Vinaya Vana Farmhouse',
            description: `Stay at ${selectedRoom.name} (${bookingForm.checkIn} to ${bookingForm.checkOut})`,
            image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=200',
            prefill: { name: bookingForm.guestName, contact: bookingForm.guestPhone },
            theme: { color: '#3ba573' },
            handler: function (response: any) { finalizeBooking(response.razorpay_payment_id); },
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
    }
  };

  const finalizeBooking = async (paymentId?: string) => {
    const isAvailable = checkAvailability(bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut);
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
        const updatedBookings = await api.bookings.getAll();
        setBookings(updatedBookings);
        setShowSimulatedPayment(false);
        setBookingSuccess(true);
        setBookingForm({ roomId: rooms[0]?.id || '', guestName: '', guestPhone: '', checkIn: '', checkOut: '' });
        setTotalPrice(0);
    } catch (err) { alert("Booking failed to save."); }
  };

  const getWhatsAppBookingLink = () => {
      if (!selectedRoom) return '#';
      let msg = `Hi, I want to book ${selectedRoom.name}`;
      if (bookingForm.checkIn && bookingForm.checkOut) msg += ` from ${bookingForm.checkIn} to ${bookingForm.checkOut}`;
      return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  // --- Calendar Render Logic ---
  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset()*60000)).toISOString().split('T')[0];
      
      const booked = isDateBooked(dateStr);
      const isPast = dateObj < today;
      const isCheckIn = bookingForm.checkIn === dateStr;
      const isCheckOut = bookingForm.checkOut === dateStr;
      const isInRange = bookingForm.checkIn && bookingForm.checkOut && dateStr > bookingForm.checkIn && dateStr < bookingForm.checkOut;

      let bgClass = "bg-white hover:bg-nature-50 text-gray-700 cursor-pointer";
      if (isPast) bgClass = "bg-gray-100 text-gray-300 cursor-not-allowed";
      else if (booked) bgClass = "bg-red-50 text-red-300 cursor-not-allowed line-through"; 
      else if (isCheckIn || isCheckOut) bgClass = "bg-nature-600 text-white font-bold";
      else if (isInRange) bgClass = "bg-nature-100 text-nature-800";

      days.push(
        <div 
          key={day}
          onClick={() => !isPast && !booked && handleDateClick(day)}
          className={`h-9 w-9 mx-auto flex items-center justify-center text-sm rounded-full transition-all ${bgClass}`}
        >
          {day}
        </div>
      );
    }
    return days;
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
    const dateObj = new Date(year, month, day);
    const dateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset()*60000)).toISOString().split('T')[0];

    if (isDateBooked(dateStr)) return;

    const currentIn = bookingForm.checkIn ? new Date(bookingForm.checkIn) : null;
    const currentOut = bookingForm.checkOut ? new Date(bookingForm.checkOut) : null;

    if (!currentIn || (currentIn && currentOut)) {
      setBookingForm(prev => ({ ...prev, checkIn: dateStr, checkOut: '' }));
    } else if (currentIn && !currentOut) {
      if (new Date(dateStr) > currentIn) setBookingForm(prev => ({ ...prev, checkOut: dateStr }));
      else setBookingForm(prev => ({ ...prev, checkIn: dateStr, checkOut: '' }));
    }
  };

  return (
    <div className="bg-nature-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-nature-900 mb-2">Our Accommodation</h1>
            <p className="text-gray-600">Choose the perfect room for your getaway.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN: ROOM LIST */}
          <div className="lg:col-span-2 space-y-10">
            {rooms.map((room) => (
              <div 
                key={room.id} 
                className={`bg-white rounded-2xl overflow-hidden shadow-md border-2 transition-all ${selectedRoom?.id === room.id ? 'border-nature-500 ring-4 ring-nature-100' : 'border-transparent hover:border-nature-200'}`}
              >
                {/* Image Carousel Component */}
                <RoomCarousel images={room.images} name={room.name} />

                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-gray-900">{room.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Users size={16} /> Max {room.capacity} Guests</span>
                        <span className="flex items-center gap-1"><Home size={16} /> 2BHK</span>
                      </div>
                    </div>
                    <div className="text-right bg-nature-50 px-4 py-2 rounded-lg">
                      <span className="text-2xl font-bold text-nature-700">₹{room.basePrice.toLocaleString()}</span>
                      <span className="text-gray-500 text-xs block font-medium uppercase tracking-wider">Per Night</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">{room.description}</p>
                  
                  {/* Smart Amenities Icons */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {room.amenities.map((am, i) => (
                      <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                        {getAmenityIcon(am)}
                        {am}
                      </span>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => handleSelectRoom(room.id)}
                        className="bg-nature-800 hover:bg-nature-900 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                          Book This Room <ChevronRight size={16}/>
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: BOOKING SIDEBAR */}
          <div className="lg:col-span-1">
            <div id="booking-sidebar" className="bg-white p-6 rounded-2xl shadow-xl sticky top-24 border-t-4 border-nature-600">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CalendarIcon className="text-nature-600"/> Check Availability
              </h3>
              
              {bookingSuccess ? (
                <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center animate-fade-in">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <p className="font-bold text-lg">Booking Confirmed!</p>
                  <button onClick={() => setBookingSuccess(false)} className="mt-4 text-sm underline hover:text-green-900">Book another</button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Room</label>
                    <select 
                      name="roomId" 
                      value={bookingForm.roomId} 
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nature-500 outline-none font-medium"
                    >
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name} - ₹{r.basePrice}</option>)}
                    </select>
                  </div>

                  {/* Calendar Widget */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                     <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                        <span className="font-bold text-gray-800">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                     </div>
                     <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                     </div>
                     <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                     </div>
                     <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nature-600"></span> Selected</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-200"></span> Booked</span>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input type="text" name="guestName" value={bookingForm.guestName} onChange={handleInputChange} required placeholder="Full Name" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nature-500 outline-none" />
                    <input type="tel" name="guestPhone" value={bookingForm.guestPhone} onChange={handleInputChange} required placeholder="Phone Number" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-nature-500 outline-none" />
                  </div>

                  {/* Errors */}
                  {availabilityError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-start">
                          <XCircle size={16} className="mt-0.5 shrink-0" />
                          {availabilityError}
                      </div>
                  )}

                  {/* Price Summary */}
                  {totalPrice > 0 && !availabilityError && pricingBreakdown && (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3 animate-fade-in">
                      {pricingBreakdown.discountApplied > 0 && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg text-sm font-medium">
                            <Sparkles size={16} />
                            <span>Long stay discount applied: -₹{pricingBreakdown.discountApplied}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{pricingBreakdown.days} Nights x ₹{pricingBreakdown.avgPrice}</span>
                        <span>₹{totalPrice}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
                        <span>Total</span>
                        <span>₹{totalPrice}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={!!availabilityError || totalPrice === 0}
                    className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${
                        availabilityError || totalPrice === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-nature-800 hover:bg-nature-900 text-white hover:scale-[1.02]'
                    }`}
                  >
                    {availabilityError ? 'Select Valid Dates' : 'Proceed to Pay'}
                  </button>

                  <div className="text-center text-xs text-gray-400 font-medium uppercase tracking-widest">- OR -</div>

                  <a 
                    href={getWhatsAppBookingLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition-all shadow-sm"
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

      {/* Simulated Payment Modal */}
      {showSimulatedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center relative shadow-2xl transform scale-100">
            <button onClick={() => setShowSimulatedPayment(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Booking</h3>
            <p className="text-gray-500 text-sm mb-6">You are in Test Mode. No actual payment will be charged.</p>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold">₹{totalPrice}</span>
                </div>
            </div>
            
            <button onClick={() => finalizeBooking()} className="w-full py-3 bg-nature-600 hover:bg-nature-700 text-white font-bold rounded-xl shadow-lg">
                Simulate Success
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accommodation;