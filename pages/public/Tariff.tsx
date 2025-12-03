import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Added for CTA
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Room } from '../../types';
import { 
    CheckCircle, 
    ShieldCheck, 
    CreditCard, 
    Clock, 
    Info, 
    ArrowRight,
    Utensils,
    Wifi,
    Wind
} from 'lucide-react';

const Tariff = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [houseRules, setHouseRules] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS); // Added to get Hero Image

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [fetchedRooms, fetchedSettings] = await Promise.all([
                api.rooms.getAll(),
                api.settings.get()
            ]);
            setRooms(fetchedRooms);
            setSettings(fetchedSettings);
            setHouseRules(fetchedSettings.houseRules || DEFAULT_SETTINGS.houseRules);
        } catch (e) {
            console.error(e);
        }
    };
    fetchData();
  }, []);

  // Helper to map basic amenities to icons for the table
  const getQuickIcons = (room: Room) => {
      // If room has amenities array, use it, else default
      const ams = room.amenities || [];
      return (
          <div className="flex gap-2 mt-2 text-nature-600">
             {ams.some(a => a.toLowerCase().includes('wifi')) && <Wifi size={14} />}
             {ams.some(a => a.toLowerCase().includes('ac')) && <Wind size={14} />}
             {ams.some(a => a.toLowerCase().includes('kitchen')) && <Utensils size={14} />}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      
      {/* 1. MINI HERO SECTION */}
      <div 
        className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")`,
            backgroundColor: '#1a2e1a'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3 shadow-sm">
                Tariff & Policies
            </h1>
            <p className="text-lg text-nature-100 font-light max-w-xl mx-auto">
                Simple, transparent pricing. No hidden fees.
            </p>
        </div>
      </div>

      {/* 2. FLOATING CONTENT CARD */}
      <div className="flex-grow -mt-16 relative z-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
            
            {/* PRICING CARD */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-nature-50 px-6 py-4 border-b border-nature-100 flex items-center justify-between">
                    <h3 className="text-nature-900 font-bold flex items-center gap-2">
                        <CreditCard size={20} className="text-nature-600"/> 
                        Room Rates
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-nature-500 bg-white px-3 py-1 rounded-full border border-nature-200">
                        Per Night
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {rooms.map((room) => (
                        <div key={room.id} className="p-6 hover:bg-nature-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between group">
                            <div className="mb-4 sm:mb-0">
                                <h4 className="text-lg font-serif font-bold text-gray-900 group-hover:text-nature-700 transition-colors">
                                    {room.name}
                                </h4>
                                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Max {room.capacity} Guests</span>
                                    <span>•</span>
                                    <span>2BHK Entire Home</span>
                                </div>
                                {getQuickIcons(room)}
                            </div>
                            
                            <div className="text-right">
                                <div className="text-2xl font-bold text-nature-800">₹{room.basePrice.toLocaleString()}</div>
                                <div className="text-xs text-gray-400 mt-1">Excl. taxes if applicable</div>
                            </div>
                        </div>
                    ))}
                    
                    {rooms.length === 0 && (
                        <div className="p-8 text-center text-gray-400">Loading rates...</div>
                    )}
                </div>

                {/* Call to Action Footer inside Price Card */}
                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-4">Ready to experience nature?</p>
                    <Link 
                        to="/accommodation" 
                        className="inline-flex items-center gap-2 bg-nature-800 hover:bg-nature-900 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Check Availability <ArrowRight size={18} />
                    </Link>
                </div>
            </div>

            {/* POLICIES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* House Rules */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-nature-900 mb-4 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-nature-600"/>
                        House Rules
                    </h3>
                    <div className="space-y-3">
                        {houseRules ? (
                            houseRules.split('\n').map((rule, idx) => (
                                rule.trim() && (
                                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                                        <CheckCircle size={16} className="text-nature-400 shrink-0 mt-0.5" />
                                        <span>{rule}</span>
                                    </div>
                                )
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-sm">No specific rules listed.</p>
                        )}
                    </div>
                </div>

                {/* Additional Info / Good to Know */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-nature-900 mb-4 flex items-center gap-2">
                        <Info size={20} className="text-nature-600"/>
                        Good to Know
                    </h3>
                    <div className="space-y-4 flex-grow">
                        <div className="flex items-start gap-3">
                            <Clock size={18} className="text-nature-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="block font-medium text-gray-900 text-sm">Standard Check-in</span>
                                <span className="text-sm text-gray-600">12:00 PM onwards</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock size={18} className="text-nature-400 mt-0.5 shrink-0" />
                            <div>
                                <span className="block font-medium text-gray-900 text-sm">Standard Check-out</span>
                                <span className="text-sm text-gray-600">Before 11:00 AM</span>
                            </div>
                        </div>
                        <div className="p-3 bg-nature-50 rounded-lg text-xs text-nature-800 leading-relaxed border border-nature-100 mt-4">
                            <strong>Note:</strong> Early check-in or late check-out is subject to availability. Please contact us via WhatsApp to request changes.
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default Tariff;