import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Room } from '../../types';

const Tariff = () => {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    setRooms(db.rooms.getAll());
  }, []);

  return (
    <div className="min-h-screen bg-nature-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Tariff & Policies</h1>
          <p className="text-gray-600">Transparent pricing for your stay.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-nature-800 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Accommodation Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">Price per Night</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{room.name}</div>
                    <div className="text-xs text-gray-500 mt-1">AC, Kitchen, Wi-Fi included</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Up to {room.capacity} Guests
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-nature-700">
                    ₹{room.basePrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-nature-900 mb-4">House Rules & Policies</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Check-in time: 12:00 PM | Check-out time: 11:00 AM.</li>
                <li>Govt ID proof is mandatory for all guests upon arrival.</li>
                <li>Quiet hours start from 10:00 PM to maintain the peaceful nature of the farm.</li>
                <li>Smoking is not allowed inside the rooms. Designated areas available.</li>
                <li>Pets are not allowed to ensure hygiene for all guests.</li>
                <li>Cancellation: 50% refund if cancelled 7 days prior to booking.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Tariff;