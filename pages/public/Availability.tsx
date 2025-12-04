import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room, Booking, PaymentStatus, SiteSettings } from '../../types';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Calendar, MessageCircle, Info } from 'lucide-react';

const Availability = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [viewDate, setViewDate] = useState(new Date());
  
  // Date Selection State
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null); // New: Track which room is active

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, b, s] = await Promise.all([
            api.rooms.getAll(), 
            api.bookings.getAll(),
            api.settings.get()
        ]);
        setRooms(r);
        setBookings(b.filter(bk => bk.status !== PaymentStatus.FAILED));
        setSettings(s);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    fetchData();
  }, []);

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
      const today = new Date();
      today.setHours(0,0,0,0);
      if (clickedDate < today) return;

      // If clicking a different room, reset previous selection and start fresh
      if (selectedRoomId !== roomId) {
          setSelectedRoomId(roomId);
          setSelectedStart(clickedDate);
          setSelectedEnd(null);
          return;
      }

      // Standard logic for same room
      if (!selectedStart || (selectedStart && selectedEnd)) {
          setSelectedStart(clickedDate);
          setSelectedEnd(null);
      } else {
          if (clickedDate > selectedStart) {
              setSelectedEnd(clickedDate);
          } else {
              setSelectedStart(clickedDate);
              setSelectedEnd(null);
          }
      }
  };

  const getDateStatus = (dateStr: string, roomId: string) => {
      // Only highlight if this row matches the selected room
      if (selectedRoomId !== roomId) return 'none';

      const target = new Date(dateStr).getTime();
      
      if (selectedStart) {
          const start = selectedStart.getTime();
          if (selectedEnd) {
              const end = selectedEnd.getTime();
              if (target >= start && target <= end) return 'selected';
          } else {
              if (target === start) return 'selected';
          }
      }
      return 'none';
  };

  const handleBookNow = () => {
      if (!selectedStart || !selectedRoomId) return;
      
      const startStr = formatDateLocal(selectedStart);
      const endStr = selectedEnd ? formatDateLocal(selectedEnd) : startStr;
      
      // Find room name for the message
      const roomName = rooms.find(r => r.id === selectedRoomId)?.name || "a room";
      
      const text = `Hi, I checked the calendar for *${roomName}* and would like to book from ${startStr} to ${endStr}. Is it confirmed?`;
      const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      
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
               Select your dates below to see room status.
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

            {/* Selection Status / Call to Action */}
            <div className="flex items-center gap-4">
                {selectedStart ? (
                    <button 
                        onClick={handleBookNow}
                        className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 animate-pulse"
                    >
                        <MessageCircle size={20} />
                        Request {selectedStart.getDate()} {selectedEnd ? `- ${selectedEnd.getDate()}` : ''}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 text-nature-200 text-sm bg-nature-900/50 px-4 py-2 rounded-full">
                        <Info size={16} /> Select Check-In & Check-Out dates
                    </div>
                )}
            </div>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px]">
              {/* Date Header Row */}
              <div className="grid grid-cols-[200px_repeat(31,1fr)] bg-nature-50 border-b border-gray-200">
                <div className="p-4 font-bold text-nature-900 sticky left-0 bg-nature-50 z-10 border-r border-gray-200 text-sm uppercase tracking-wider">Room Type</div>
                {daysArray.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-bold text-gray-500 border-r border-gray-100 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Room Rows */}
              {rooms.map(room => (
                <div key={room.id} className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <div className="p-4 font-bold text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200 flex items-center shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-sm group-hover:text-nature-700">
                    {room.name}
                  </div>
                  {daysArray.map(day => {
                    const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const dateStr = formatDateLocal(dateObj); // Safe format YYYY-MM-DD
                    
                    const booked = isRoomBooked(room.id, dateStr);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const isPast = dateObj < today;
                    const selectionStatus = getDateStatus(dateStr, room.id); // PASS ROOM ID HERE

                    return (
                      <div key={day} className="border-r border-gray-100 relative h-14">
                        {isPast ? (
                           <div className="w-full h-full bg-gray-100 pattern-dots" title="Past Date"></div>
                        ) : booked ? (
                          <div className="w-full h-full bg-red-50 flex items-center justify-center cursor-not-allowed" title="Booked">
                            <XCircle size={14} className="text-red-300" />
                          </div>
                        ) : (
                          <div 
                            className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200
                                ${selectionStatus === 'selected' 
                                    ? 'bg-nature-600 text-white shadow-inner scale-105' 
                                    : 'bg-white hover:bg-green-100'
                                }`} 
                            title="Available - Click to Select"
                            onClick={() => handleDateClick(dateStr, room.id)} // PASS ROOM ID HERE
                          >
                            {selectionStatus === 'selected' ? (
                                <CheckCircle size={16} className="text-white" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-green-200"></div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="p-4 bg-gray-50 flex flex-wrap gap-6 text-xs font-medium text-gray-600 justify-center border-t border-gray-200">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-200"></div> Available</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-nature-600"></div> Selected</div>
             <div className="flex items-center gap-2"><XCircle size={14} className="text-red-300"/> Booked</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded"></div> Past Dates</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Availability;