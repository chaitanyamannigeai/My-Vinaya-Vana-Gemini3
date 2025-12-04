import React, { useEffect, useState } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { CabLocation, Driver, SiteSettings } from '../../types';
import { MapPin, Phone, MessageCircle, Navigation, Car, ShieldCheck, Music, Wind, Briefcase } from 'lucide-react';

const Cabs = () => {
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [fetchedLocs, fetchedDrivers, fetchedSettings] = await Promise.all([
                api.locations.getAll(),
                api.drivers.getAll(),
                api.settings.get()
            ]);
            setLocations(fetchedLocs.filter(l => l.active));
            setDrivers(fetchedDrivers.filter(d => d.active));
            setSettings(fetchedSettings);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const getDriverForLocation = (loc: CabLocation) => {
      if (loc.driverId) return drivers.find(d => d.id === loc.driverId);
      return drivers.find(d => d.isDefault) || drivers[0];
  };

  const handleBookRide = (loc: CabLocation) => {
      const driver = getDriverForLocation(loc);
      if (!driver) return;
      
      const text = `Hi, I am interested in booking a cab for: *${loc.name}* (Price: ₹${loc.price}). Is it available?`;
      const url = `https://wa.me/${driver.whatsapp || driver.phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const handleGeneralInquiry = () => {
      const defaultDriver = drivers.find(d => d.isDefault) || drivers[0];
      const phone = defaultDriver ? (defaultDriver.whatsapp || defaultDriver.phone) : settings.whatsappNumber;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent("Hi, I need a cab service in Gokarna.")}`;
      window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* 1. COMPACT HERO SECTION */}
      <div 
        className="relative h-[35vh] bg-cover bg-center flex items-center justify-center"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")`,
            backgroundColor: '#1a2e1a'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2 shadow-sm">
                Travel Desk
            </h1>
            <p className="text-gray-300 font-light max-w-xl mx-auto">
               Premium transfers and sightseeing packages for a seamless journey.
            </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
         
         {/* 2. FLEET HIGHLIGHTS (Static Trust Signals) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                 <div className="bg-nature-50 p-2 rounded-lg text-nature-700"><ShieldCheck size={20}/></div>
                 <div className="text-sm">
                     <p className="font-bold text-gray-900">Verified Drivers</p>
                     <p className="text-gray-500 text-xs">Local experts, safe driving.</p>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                 <div className="bg-nature-50 p-2 rounded-lg text-nature-700"><Car size={20}/></div>
                 <div className="text-sm">
                     <p className="font-bold text-gray-900">Premium Fleet</p>
                     <p className="text-gray-500 text-xs">Sedans, SUVs & Travellers.</p>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                 <div className="bg-nature-50 p-2 rounded-lg text-nature-700"><Briefcase size={20}/></div>
                 <div className="text-sm">
                     <p className="font-bold text-gray-900">Fixed Pricing</p>
                     <p className="text-gray-500 text-xs">No hidden charges.</p>
                 </div>
             </div>
         </div>

         {/* 3. HORIZONTAL ROUTE LIST (The "Rate Card" Look) */}
         <div className="space-y-6">
             <div className="flex justify-between items-end px-2">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="text-nature-600" size={20}/> Popular Routes
                </h2>
                <button 
                    onClick={handleGeneralInquiry}
                    className="text-nature-700 text-sm font-bold hover:underline flex items-center gap-1"
                >
                    Custom Request <Navigation size={14}/>
                </button>
             </div>

             {loading ? (
                 <div className="text-center py-12 text-gray-400">Loading routes...</div>
             ) : (
                 <div className="space-y-4">
                     {locations.map(loc => (
                         <div key={loc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-all duration-300">
                             
                             {/* Image Section */}
                             <div className="md:w-48 h-48 md:h-auto relative shrink-0 overflow-hidden">
                                 <img 
                                    src={loc.imageUrl} 
                                    alt={loc.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                 />
                             </div>
                             
                             {/* Content Section */}
                             <div className="p-6 flex-grow flex flex-col justify-center">
                                 <h3 className="font-serif font-bold text-xl text-nature-900 mb-2">{loc.name}</h3>
                                 <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    {loc.description || "Comfortable AC ride with professional driver. Includes fuel and toll charges."}
                                 </p>
                                 
                                 {/* Amenities Icons (Visual Fluff) */}
                                 <div className="flex gap-4 text-xs text-gray-400 mb-4">
                                     <span className="flex items-center gap-1"><Wind size={14}/> AC</span>
                                     <span className="flex items-center gap-1"><Music size={14}/> Music</span>
                                     <span className="flex items-center gap-1"><ShieldCheck size={14}/> Sanitized</span>
                                 </div>
                             </div>

                             {/* Price & Action Section */}
                             <div className="bg-gray-50 p-6 md:w-48 flex flex-col justify-center items-center border-l border-gray-100 shrink-0">
                                 <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Fare</p>
                                 <p className="text-2xl font-bold text-nature-700 mb-4">₹{loc.price.toLocaleString()}</p>
                                 
                                 <button 
                                    onClick={() => handleBookRide(loc)}
                                    className="w-full bg-nature-800 hover:bg-nature-900 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                                 >
                                     <MessageCircle size={16} /> Book Now
                                 </button>
                             </div>
                         </div>
                     ))}
                     
                     {locations.length === 0 && (
                         <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                             <p className="text-gray-500">No specific routes listed.</p>
                         </div>
                     )}
                 </div>
             )}
         </div>

      </div>
    </div>
  );
};

export default Cabs;