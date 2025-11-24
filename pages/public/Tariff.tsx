
import React, { useEffect, useState } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room } from '../../types';

const Tariff = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [houseRules, setHouseRules] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [fetchedRooms, fetchedSettings] = await Promise.all([
                api.rooms.getAll(),
                api.settings.get()
            ]);
            setRooms(fetchedRooms);
            setHouseRules(fetchedSettings.houseRules || DEFAULT_SETTINGS.houseRules);
        } catch (e) {
            console.error(e);
        }
    };
    fetchData();
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
            <h3 className="text-xl font-bold text-nature-900 mb-6">House Rules & Policies</h3>
            <div className="text-gray-600 space-y-4 leading-relaxed whitespace-pre-line">
                {houseRules.split('\n').map((rule, idx) => (
                    rule.trim() ? (
                        <div key={idx} className="flex items-start gap-3">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-nature-500 rounded-full shrink-0"></span>
                            <span>{rule}</span>
                        </div>
                    ) : null
                ))}
                {(!houseRules) && <p>No specific policies defined.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Tariff;