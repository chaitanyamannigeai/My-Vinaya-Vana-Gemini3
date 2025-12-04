import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, PaymentStatus, SiteSettings, PricingRule } from '../../types';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Calendar, MessageCircle, Info, X, User, Phone as PhoneIcon, CreditCard, ShieldCheck } from 'lucide-react';

// Declare Razorpay for TypeScript
declare global {
    interface Window { Razorpay: any; }
}

const Availability = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [viewDate, setViewDate] = useState(new Date());
  
  // Date Selection State
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, b, p, s] = await Promise.all([
            api.rooms.getAll(), 
            api.bookings.getAll(),
            api.pricing.getAll(),
            api.settings.get()
        ]);
        setRooms(r);
        setBookings(b.filter(bk => bk.status !== PaymentStatus.FAILED));
        setPricingRules(p);
        setSettings(s);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    fetchData();
  }, []);

  // --- 1. PRICING ENGINE (The Brain) ---
  const getPriceMultiplier = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      // Check against Admin Panel Pricing Rules
      const activeRule = pricingRules.find(r => 
          dateStr >= r.startDate && dateStr <= r.endDate
      );
      
      if (activeRule) return activeRule.multiplier;
      
      // Optional: Add hardcoded weekend logic here if needed (e.g. Fri/Sat = 1.2x)
      return 1.0; 
  };

  const calculateTotal = () => {
      if (!selectedRoomId || !selectedStart || !selectedEnd) return 0;
      const room = rooms.find(r => r.id === selectedRoomId);
      if (!room) return 0;

      let total = 0;
      // Clone date to iterate without modifying state
      let current = new Date(selectedStart);
      
      // Loop through every night of the stay
      while (current < selectedEnd) {
          const multiplier = getPriceMultiplier(current);
          total += (room.basePrice * multiplier);
          
          // Move to next day
          current.setDate(current.getDate() + 1);
      }
      
      return Math.round(total);
  };

  // --- 2. PAYMENT INTEGRATION (Razorpay/GPay) ---
  const loadRazorpay = () => {
      return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
      });
  };

  const handleOnlinePayment = async (bookingId: string, amount: number, roomName: string) => {
      const res = await loadRazorpay();
      
      if (!res) {
          alert('Payment gateway failed to load. Please check internet connection.');
          return;
      }

      if (!settings.razorpayKey || settings.razorpayKey === 'rzp_test_123456789') {
          alert("Payment gateway not configured by admin yet. Please use WhatsApp.");
          return;
      }

      const options = {
          key: settings.razorpayKey, 
          amount: amount * 100, // Razorpay takes amount in paise
          currency: "INR",
          name: "Vinaya Vana",
          description: `Stay in ${roomName}`,
          image: "https://vinayavana.com/logo.png", // Your logo
          
          handler: async function (response: any) {
              // On Success: Update DB to PAID
              try {
                  await api.bookings.updateStatus(bookingId, 'PAID' as PaymentStatus);
                  alert(`Booking Confirmed! Payment ID: ${response.razorpay_payment_id}`);
                  window.location.reload();
              } catch (e) {
                  alert("Payment successful but database update failed. Please contact support.");
              }
          },
          prefill: {
              name: guestName,
              contact: guestPhone,
              email: "guest@vinayavana.com"
          },
          notes: {
              booking_id: bookingId,
          },
          theme: {
              color: "#1a2e1a" // Matches your green theme
          }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
          alert(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
  };

  // --- 3. BOOKING LOGIC ---
  const handleCreateBooking = async (payOnline: boolean) => {
      if (!selectedStart || !selectedRoomId || !guestName || !guestPhone) return;
      setIsSubmitting(true);

      const room = rooms.find(r => r.id === selectedRoomId);
      const startStr = formatDateLocal(selectedStart);
      const endStr = selectedEnd ? formatDateLocal(selectedEnd) : startStr;
      const totalAmount = calculateTotal();
      const bookingId = `BK-${Date.now()}`;

      // Create Object
      const newBooking: Booking = {
          id: bookingId,
          roomId: selectedRoomId,
          guestName,
          guestPhone,
          checkIn: startStr,
          checkOut: endStr,
          totalAmount: totalAmount,
          status: 'PENDING',
          createdAt: new Date().toISOString()
      };

      try {
          // A. Save to Database (Always do this first)
          await api.bookings.add(newBooking);

          if (payOnline) {
              // B1. Open Payment Gateway
              setShowModal(false);
              handleOnlinePayment(bookingId, totalAmount, room?.name || 'Room');
          } else {
              // B2. Open WhatsApp
              const text = `*New Booking Request*\nRef: ${bookingId}\nName: ${guestName}\nRoom: ${room?.name}\nDates: ${startStr} to ${endStr}\nTotal: ₹${totalAmount}\n\nI would like to confirm this booking using GPay/Cash.`;
              const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
              
              window.open(waUrl, '_blank');
              setShowModal(false);
              alert("Request sent! Please check WhatsApp.");
              window.location.reload();
          }

      } catch (err) {
          console.error(err);
          alert("Failed to create booking. Please try again.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };
  const isRoomBooked = (roomId: string, dateStr: string) => {
    const target = new Date(dateStr).getTime();
    return bookings.some(b => {
      if (b.roomId !== roomId) return false;
      const start = new Date(b.checkIn).getTime();
      const end = new Date(b.checkOut).getTime();
      return target >= start && target < end;
    });
  };
  const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };
  const handleDateClick = (dateStr: string, roomId: string) => {
      const clickedDate = new Date(dateStr);
      const today = new Date(); today.setHours(0,0,0,0);
      if (clickedDate < today) return;

      if (selectedRoomId !== roomId) {
          setSelectedRoomId(roomId); setSelectedStart(clickedDate); setSelectedEnd(null); return;
      }
      if (!selectedStart || (selectedStart && selectedEnd)) {
          setSelectedStart(clickedDate); setSelectedEnd(null);
      } else {
          if (clickedDate > selectedStart) setSelectedEnd(clickedDate);
          else { setSelectedStart(clickedDate); setSelectedEnd(null); }
      }
  };
  const getDateStatus = (dateStr: string, roomId: string) => {
      if (selectedRoomId !== roomId) return 'none';
      const target = new Date(dateStr).getTime();
      if (selectedStart) {
          const start = selectedStart.getTime();
          if (selectedEnd) {
              const end = selectedEnd.getTime();
              if (target >= start && target <= end) return 'selected';
          } else { if (target === start) return 'selected'; }
      }
      return 'none';
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col relative">
      
      {/* 1. MINI HERO */}
      <div 
        className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")`,
            backgroundColor: '#1a2e1a'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-white/20">
                <Calendar className="text-green-400" size={20} />
                <span className="text-white text-sm font-bold tracking-wider uppercase">Plan Your Trip</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 shadow-sm">
                Check Availability
            </h1>
            <p className="text-lg text-nature-100 font-light max-w-2xl mx-auto leading-relaxed">
               Select dates to calculate price and book instantly.
            </p>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-nature-200">
          
          {/* Calendar Header */}
          <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-nature-800 text-white gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-nature-700 rounded-full transition-colors border border-nature-600"><ChevronLeft size={24} /></button>
                <div className="text-2xl font-bold font-serif tracking-wide w-48 text-center">{monthName}</div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-nature-700 rounded-full transition-colors border border-nature-600"><ChevronRight size={24} /></button>
            </div>

            {/* Selection Status */}
            <div className="flex items-center gap-4">
                {selectedStart && selectedEnd ? (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 animate-pulse"
                    >
                        <CreditCard size={20} />
                        Review & Pay
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-nature-200 text-sm bg-nature-900/50 px-4 py-2 rounded-full">
                        <Info size={16} /> Select Dates
                    </div>
                )}
            </div>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[200px_repeat(31,1fr)] bg-nature-50 border-b border-gray-200">
                <div className="p-4 font-bold text-nature-900 sticky left-0 bg-nature-50 z-10 border-r border-gray-200 text-sm uppercase tracking-wider">Room Type</div>
                {daysArray.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-bold text-gray-500 border-r border-gray-100 flex items-center justify-center">{day}</div>
                ))}
              </div>

              {rooms.map(room => (
                <div key={room.id} className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <div className="p-4 font-bold text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200 flex items-center shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-sm group-hover:text-nature-700">
                    {room.name}
                  </div>
                  {daysArray.map(day => {
                    const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const dateStr = formatDateLocal(dateObj);
                    const booked = isRoomBooked(room.id, dateStr);
                    const today = new Date(); today.setHours(0,0,0,0);
                    const isPast = dateObj < today;
                    const selectionStatus = getDateStatus(dateStr, room.id);

                    return (
                      <div key={day} className="border-r border-gray-100 relative h-14">
                        {isPast ? <div className="w-full h-full bg-gray-100 pattern-dots" title="Past"></div> : 
                         booked ? <div className="w-full h-full bg-red-50 flex items-center justify-center cursor-not-allowed" title="Booked"><XCircle size={14} className="text-red-300" /></div> : 
                         <div 
                            className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 ${selectionStatus === 'selected' ? 'bg-nature-600 text-white shadow-inner scale-105' : 'bg-white hover:bg-green-100'}`} 
                            onClick={() => handleDateClick(dateStr, room.id)}
                          >
                            {selectionStatus === 'selected' ? <CheckCircle size={16} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-green-200"></div>}
                          </div>
                        }
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 flex flex-wrap gap-6 text-xs font-medium text-gray-600 justify-center border-t border-gray-200">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-200"></div> Available</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-nature-600"></div> Selected</div>
             <div className="flex items-center gap-2"><XCircle size={14} className="text-red-300"/> Booked</div>
          </div>
        </div>
      </div>

      {/* --- PAYMENT & CONFIRMATION MODAL --- */}
      {showModal && selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                  <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X size={24}/></button>
                  
                  <div className="bg-nature-900 p-6 text-white">
                      <h3 className="text-xl font-serif font-bold">Secure Booking</h3>
                      <p className="text-nature-200 text-sm mt-1">Complete payment to lock these dates.</p>
                  </div>

                  <div className="p-6 space-y-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Room</span>
                          <span className="font-bold text-gray-900">{selectedRoom.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Dates</span>
                          <span className="font-bold text-gray-900">
                              {selectedStart?.getDate()}/{selectedStart?.getMonth()!+1} - {selectedEnd?.getDate()}/{selectedEnd?.getMonth()!+1}
                          </span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-bold text-gray-700">Total Due</span>
                          <span className="font-bold text-2xl text-nature-700">₹{calculateTotal().toLocaleString()}</span>
                      </div>
                  </div>

                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                          <div className="relative">
                              <User className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                              <input 
                                type="text" 
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-nature-500 outline-none"
                                placeholder="Full Name"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                          <div className="relative">
                              <PhoneIcon className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                              <input 
                                type="tel" 
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-nature-500 outline-none"
                                placeholder="+91 99999 99999"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                          {/* OPTION 1: INSTANT PAY */}
                          <button 
                            onClick={() => handleCreateBooking(true)}
                            disabled={!guestName || !guestPhone || isSubmitting}
                            className="bg-nature-800 hover:bg-nature-900 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg disabled:opacity-50 transition-transform hover:scale-[1.02]"
                          >
                              <div className="flex items-center gap-2"><ShieldCheck size={18} /> Pay Now</div>
                              <span className="text-[10px] font-normal opacity-80">GPay / Card / UPI</span>
                          </button>

                          {/* OPTION 2: WHATSAPP */}
                          <button 
                            onClick={() => handleCreateBooking(false)}
                            disabled={!guestName || !guestPhone || isSubmitting}
                            className="bg-white border-2 border-[#25D366] text-[#25D366] hover:bg-green-50 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-transform hover:scale-[1.02]"
                          >
                              <div className="flex items-center gap-2"><MessageCircle size={18} /> WhatsApp</div>
                              <span className="text-[10px] font-normal text-gray-500">Pay later</span>
                          </button>
                      </div>
                      
                      <p className="text-center text-[10px] text-gray-400 mt-2">
                          Payments are secured by Razorpay. 
                      </p>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Availability;