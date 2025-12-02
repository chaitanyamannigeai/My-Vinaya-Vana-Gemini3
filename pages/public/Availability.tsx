import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../../services/api';
import { Room, Booking, PaymentStatus } from '../../types';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Calendar } from 'lucide-react';

const { useNavigate } = ReactRouterDOM as any;

const Availability = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r, b] = await Promise.all([api.rooms.getAll(), api.bookings.getAll()]);
        setRooms(r);
        setBookings(b.filter(bk => bk.status !== PaymentStatus.FAILED));
      } catch (e) {
        console.error("Failed to load availability data", e);
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

  const handleDateClick = (dateStr: string) => {
      navigate(`/accommodation?date=${dateStr}`);
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-nature-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Availability Calendar</h1>
          <p className="text-gray-600">Check availability for all our rooms at a glance.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-nature-200">
          {/* Header Controls */}
          <div className="flex items-center justify-between p-6 bg-nature-800 text-white">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-nature-700 rounded-full transition-colors"><ChevronLeft size={24} /></button>
            <div className="flex items-center gap-3 text-xl font-bold">
              <Calendar size={24} />
              {monthName}
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-nature-700 rounded-full transition-colors"><ChevronRight size={24} /></button>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Date Header Row */}
              <div className="grid grid-cols-[200px_repeat(31,1fr)] bg-nature-50 border-b border-gray-200">
                <div className="p-4 font-bold text-nature-900 sticky left-0 bg-nature-50 z-10 border-r border-gray-200">Room</div>
                {daysArray.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 border-r border-gray-100">
                    {day}
                  </div>
                ))}
              </div>

              {/* Room Rows */}
              {rooms.map(room => (
                <div key={room.id} className="grid grid-cols-[200px_repeat(31,1fr)] border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="p-4 font-medium text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200 flex items-center shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    {room.name}
                  </div>
                  {daysArray.map(day => {
                    const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
                    const booked = isRoomBooked(room.id, dateStr);
                    const isPast = new Date(dateStr) < new Date(new Date().setHours(0,0,0,0));

                    return (
                      <div key={day} className="border-r border-gray-100 relative h-12">
                        {isPast ? (
                           <div className="w-full h-full bg-gray-100" title="Past Date"></div>
                        ) : booked ? (
                          <div className="w-full h-full bg-red-100 flex items-center justify-center" title="Booked">
                            <XCircle size={16} className="text-red-400" />
                          </div>
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center bg-green-100 cursor-pointer hover:bg-green-200 transition-colors" 
                            title="Available - Click to Book"
                            onClick={() => handleDateClick(dateStr)}
                          >
                            <CheckCircle size={16} className="text-green-600" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 flex gap-6 text-sm text-gray-600 justify-center">
             <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-600"/> Available (Click to Book)</div>
             <div className="flex items-center gap-2"><XCircle size={16} className="text-red-400"/> Booked</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-200 rounded"></div> Past</div>
          </div>
        </div>
      </div>
    </div>
  );
  
}; 

export default Availability;