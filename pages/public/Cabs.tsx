import React, { useEffect, useState, useMemo } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { CabLocation, Driver, SiteSettings, CabVehicle } from '../../types';
import { MapPin, Phone, MessageCircle, Navigation, Car, ShieldCheck, Music, Wind, Briefcase, Users, Fuel, Star, Check } from 'lucide-react';

const Cabs = () => {
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [vehicles, setVehicles] = useState<CabVehicle[]>([]); 
  const [loading, setLoading] = useState(true);

  // Track active image for each vehicle card (for mini-gallery)
  const [activeImages, setActiveImages] = useState<Record<string, string>>({});

  // ✅ NEW: Track selected variant for grouped routes (RouteName -> LocationID)
  const [activeVariants, setActiveVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [fetchedLocs, fetchedDrivers, fetchedSettings, fetchedVehicles] = await Promise.all([
                api.locations.getAll(),
                api.drivers.getAll(),
                api.settings.get(),
                api.vehicles.getAll() 
            ]);
            setLocations(fetchedLocs.filter(l => l.active));
            setDrivers(fetchedDrivers.filter(d => d.active));
            setSettings(fetchedSettings);
            setVehicles(fetchedVehicles.filter(v => v.active));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // ✅ NEW: Group locations by name to create "Smart Cards"
  const groupedLocations = useMemo(() => {
      const groups: Record<string, CabLocation[]> = {};
      locations.forEach(loc => {
          const trimmedName = loc.name.trim();
          if (!groups[trimmedName]) groups[trimmedName] = [];
          groups[trimmedName].push(loc);
      });
      
      // Sort each group by price (Low to High)
      Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => (a.price || 0) - (b.price || 0));
      });
      
      return groups;
  }, [locations]);

  // Helpers
  const defaultDriver = drivers.find(d => d.isDefault) || drivers[0];

  const getDriverForLocation = (loc: CabLocation) => {
      if (loc.driverId) return drivers.find(d => d.id === loc.driverId);
      return defaultDriver;
  };

  const getVehicleForLocation = (loc: CabLocation) => {
      const driver = getDriverForLocation(loc);
      if (!driver || !driver.assignedVehicleId) return null;
      return vehicles.find(v => v.id === driver.assignedVehicleId);
  };

  const handleImageClick = (vehicleId: string, imgUrl: string) => {
      setActiveImages(prev => ({...prev, [vehicleId]: imgUrl}));
  };

  const handleBookVehicle = (vehicle: CabVehicle) => {
      const linkedDriver = drivers.find(d => d.assignedVehicleId === vehicle.id);
      const rawNumber = linkedDriver?.whatsapp || linkedDriver?.phone || settings.whatsappNumber;
      const cleanNumber = rawNumber?.replace(/[^0-9]/g, '');
      const text = `Hello, I am interested in booking the *${vehicle.name}* (${vehicle.vehicleType}). Please let me know availability.`;
      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleBookRide = (loc: CabLocation) => {
      const driver = getDriverForLocation(loc);
      const vehicle = getVehicleForLocation(loc);
      const rawNumber = driver?.whatsapp || settings.whatsappNumber;
      const cleanNumber = rawNumber?.replace(/[^0-9]/g, '');

      let text = `Hello, I would like to book the cab for *${loc.name}*. Price mentioned is ₹${loc.price}.`;
      if (vehicle) {
          text += ` I see it is managed by ${driver?.name} driving a *${vehicle.name}* (${vehicle.capacity} Seater).`;
      }
      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* 1. HERO SECTION */}
      <div className="bg-nature-900 text-white py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Premium Cab Services</h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                Comfortable, safe, and reliable transport for your Gokarna adventures and airport transfers.
            </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 space-y-16">
          
          {/* 2. FLEET HIGHLIGHTS */}
          <div className="bg-white p-8 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-b-4 border-nature-600">
              <div className="flex flex-col items-center">
                  <div className="bg-nature-100 p-4 rounded-full text-nature-700 mb-4"><ShieldCheck size={32}/></div>
                  <h3 className="font-bold text-lg mb-2">Verified Drivers</h3>
                  <p className="text-gray-500 text-sm">Experienced, licensed, and background-checked chauffeurs.</p>
              </div>
              <div className="flex flex-col items-center">
                  <div className="bg-nature-100 p-4 rounded-full text-nature-700 mb-4"><Car size={32}/></div>
                  <h3 className="font-bold text-lg mb-2">Premium Fleet</h3>
                  <p className="text-gray-500 text-sm">Clean, well-maintained vehicles equipped with AC and music.</p>
              </div>
              <div className="flex flex-col items-center">
                  <div className="bg-nature-100 p-4 rounded-full text-nature-700 mb-4"><Navigation size={32}/></div>
                  <h3 className="font-bold text-lg mb-2">Flexible Packages</h3>
                  <p className="text-gray-500 text-sm">Custom sightseeing tours and airport pickup/drop services.</p>
              </div>
          </div>

          {/* 3. OUR PREMIUM FLEET SECTION */}
          {vehicles.length > 0 && (
              <div className="animate-fade-in">
                  <div className="text-center mb-10">
                      <span className="text-nature-600 font-bold uppercase tracking-wider text-sm">Comfort & Style</span>
                      <h2 className="text-3xl font-bold text-gray-800 mt-2">Our Premium Fleet</h2>
                      <p className="text-gray-500 mt-2">Choose the perfect vehicle for your group size and comfort preference</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {vehicles.map(vehicle => {
                          const activeImg = activeImages[vehicle.id] || (vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : 'https://via.placeholder.com/400x300?text=Vehicle');
                          const assignedDriver = drivers.find(d => d.assignedVehicleId === vehicle.id);

                          return (
                              <div key={vehicle.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
                                  <div className="relative h-56 bg-gray-200 overflow-hidden">
                                      <img src={activeImg} alt={vehicle.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                      <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                                          {vehicle.vehicleType}
                                      </div>
                                  </div>
                                  
                                  {vehicle.images && vehicle.images.length > 1 && (
                                      <div className="flex gap-2 p-3 bg-gray-50 overflow-x-auto border-b border-gray-100 no-scrollbar">
                                          {vehicle.images.map((img, idx) => (
                                              <button 
                                                key={idx} 
                                                onClick={() => handleImageClick(vehicle.id, img)}
                                                className={`w-12 h-12 shrink-0 rounded-md border-2 overflow-hidden transition-all ${activeImg === img ? 'border-nature-600 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                              >
                                                  <img src={img} className="w-full h-full object-cover" loading="lazy" />
                                              </button>
                                          ))}
                                      </div>
                                  )}

                                  <div className="p-6 flex-grow flex flex-col">
                                      <div className="flex justify-between items-start mb-3">
                                          <h3 className="text-xl font-bold text-gray-800">{vehicle.name}</h3>
                                          {vehicle.baseRate && vehicle.baseRate > 0 && (
                                              <div className="text-right">
                                                  <span className="block text-lg font-bold text-nature-700">₹{vehicle.baseRate}</span>
                                                  <span className="text-xs text-gray-400 font-medium uppercase">Per KM</span>
                                              </div>
                                          )}
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
                                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Users size={14} className="text-nature-600"/> {vehicle.capacity} Seats</span>
                                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded"><Fuel size={14} className="text-nature-600"/> AC Cab</span>
                                      </div>

                                      <div className="flex flex-wrap gap-2 mb-6">
                                          {vehicle.features.map((f, i) => (
                                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">{f}</span>
                                          ))}
                                      </div>
                                      
                                      {assignedDriver && (
                                          <div className="mb-4 text-xs text-gray-400 flex items-center gap-1">
                                              <ShieldCheck size={12} className="text-green-500"/>
                                              Driven by {assignedDriver.name}
                                          </div>
                                      )}

                                      <button 
                                          onClick={() => handleBookVehicle(vehicle)}
                                          className="mt-auto w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:translate-y-[-2px] shadow-sm"
                                      >
                                          <MessageCircle size={18} /> Check Availability
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* 4. POPULAR ROUTES (✅ NEW: Smart Grouping Logic) */}
          {Object.keys(groupedLocations).length > 0 && (
             <div>
                 <div className="text-center mb-10">
                    <span className="text-nature-600 font-bold uppercase tracking-wider text-sm">Destinations</span>
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">Popular Routes</h2>
                    <p className="text-gray-500 mt-2">Fixed price drops and sightseeing packages</p>
                 </div>
                 
                 <div className="grid gap-6">
                     {Object.keys(groupedLocations).map(groupName => {
                         const variants = groupedLocations[groupName];
                         // Determine which specific location/variant to show
                         const activeId = activeVariants[groupName] || variants[0].id;
                         const activeLoc = variants.find(l => l.id === activeId) || variants[0];
                         
                         const driver = getDriverForLocation(activeLoc);
                         const vehicle = getVehicleForLocation(activeLoc);

                         return (
                             <div key={groupName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                                 <div className="md:w-1/3 h-48 md:h-auto relative">
                                     <img src={activeLoc.imageUrl} alt={activeLoc.name} className="w-full h-full object-cover" loading="lazy" />
                                     <div className="absolute top-0 left-0 bg-nature-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                         POPULAR
                                     </div>
                                 </div>
                                 
                                 <div className="p-6 md:w-1/3 flex-grow flex flex-col justify-center">
                                     <h3 className="text-xl font-bold text-gray-800 mb-2">{activeLoc.name}</h3>
                                     <p className="text-gray-600 text-sm mb-4 line-clamp-2">{activeLoc.description}</p>
                                     
                                     {/* ✅ NEW: Vehicle Variant Selector */}
                                     {variants.length > 1 && (
                                         <div className="mb-4">
                                             <label className="text-xs font-bold text-nature-700 uppercase tracking-wide mb-2 block">Select Vehicle Type:</label>
                                             <div className="flex flex-wrap gap-2">
                                                 {variants.map(v => {
                                                     const vInfo = getVehicleForLocation(v);
                                                     // Fallback label if no vehicle linked: "Option 1", "Option 2"
                                                     const label = vInfo ? `${vInfo.vehicleType}` : `Option ${variants.indexOf(v) + 1}`;
                                                     const isActive = v.id === activeLoc.id;
                                                     
                                                     return (
                                                         <button
                                                            key={v.id}
                                                            onClick={() => setActiveVariants(prev => ({...prev, [groupName]: v.id}))}
                                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${isActive ? 'bg-nature-700 text-white border-nature-700 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-nature-300'}`}
                                                         >
                                                             {isActive && <Check size={12}/>}
                                                             {label}
                                                         </button>
                                                     );
                                                 })}
                                             </div>
                                         </div>
                                     )}

                                     <div className="space-y-2">
                                         <div className="flex items-center gap-2 text-sm text-gray-500">
                                             <ShieldCheck size={16} className="text-nature-600" />
                                             <span>Managed by <b>{driver?.name || 'Travel Desk'}</b></span>
                                         </div>
                                         
                                         {vehicle ? (
                                             <div className="flex items-center gap-2 text-sm text-gray-500 bg-nature-50 p-2 rounded border border-nature-100">
                                                 <Car size={16} className="text-nature-700" />
                                                 <span>{vehicle.name} ({vehicle.vehicleType}) • <b>{vehicle.capacity} Seats</b></span>
                                             </div>
                                         ) : (
                                             <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                                                 <Car size={16} />
                                                 <span>Vehicle assigned on booking</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 <div className="bg-gray-50 p-6 md:w-48 flex flex-col justify-center items-center border-l border-gray-100 shrink-0">
                                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Fare</p>
                                     {/* Price updates automatically based on activeLoc */}
                                     <p className="text-2xl font-bold text-nature-700 mb-4 animate-fade-in">₹{activeLoc.price?.toLocaleString()}</p>
                                     
                                     <button 
                                        onClick={() => handleBookRide(activeLoc)}
                                        className="w-full bg-nature-800 hover:bg-nature-900 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                                     >
                                         <MessageCircle size={16} /> Book Now
                                     </button>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             </div>
          )}

          {/* Empty State Fallback */}
          {locations.length === 0 && vehicles.length === 0 && (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <Car size={48} className="mx-auto text-gray-300 mb-4" />
                 <p className="text-gray-500 text-lg">Transport options are being updated.</p>
                 <p className="text-gray-400 text-sm">Please contact the front desk directly.</p>
             </div>
          )}

      </div>
    </div>
  );
};

export default Cabs;