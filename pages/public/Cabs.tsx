import React, { useEffect, useState, useMemo } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { CabLocation, Driver, SiteSettings, CabVehicle } from '../../types';
import { MapPin, Phone, MessageCircle, Navigation, Car, ShieldCheck, Music, Wind, Briefcase, Users, Fuel, Star, Check, Plane, Train, Map } from 'lucide-react';

const Cabs = () => {
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [vehicles, setVehicles] = useState<CabVehicle[]>([]); 
  const [loading, setLoading] = useState(true);

  // Track active image for each vehicle card (for mini-gallery)
  const [activeImages, setActiveImages] = useState<Record<string, string>>({});

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

  // --- SMART GROUPING & CATEGORIZATION ---
  const { sightseeing, transfers, localDrops } = useMemo(() => {
      const groups: Record<string, CabLocation[]> = {};
      
      // 1. Group by Name
      locations.forEach(loc => {
          const trimmedName = loc.name.trim();
          if (!groups[trimmedName]) groups[trimmedName] = [];
          groups[trimmedName].push(loc);
      });

      // 2. Sort variants by price
      Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => (a.price || 0) - (b.price || 0));
      });

      const sightseeing: Record<string, CabLocation[]> = {};
      const transfers: Record<string, CabLocation[]> = {};
      const localDrops: Record<string, CabLocation[]> = {};

      // 3. Categorize based on keywords
      Object.keys(groups).forEach(name => {
          const lowerName = name.toLowerCase();
          if (lowerName.includes('sightseeing') || lowerName.includes('tour') || lowerName.includes('package')) {
              sightseeing[name] = groups[name];
          } else if (lowerName.includes('airport') || lowerName.includes('station') || lowerName.includes('railway') || lowerName.includes('drop')) {
              transfers[name] = groups[name];
          } else {
              localDrops[name] = groups[name];
          }
      });

      return { sightseeing, transfers, localDrops };
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

  const handleBookVehicle = (vehicle: CabVehicle) => {
      const linkedDriver = drivers.find(d => d.assignedVehicleId === vehicle.id);
      const rawNumber = linkedDriver?.whatsapp || linkedDriver?.phone || settings.whatsappNumber;
      const cleanNumber = rawNumber?.replace(/[^0-9]/g, '');
      const text = `Hello, I am interested in booking the *${vehicle.name}* (${vehicle.vehicleType}). Please let me know availability.`;
      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleBookRide = (loc: CabLocation, vehicleName?: string) => {
      const driver = getDriverForLocation(loc);
      const vehicle = getVehicleForLocation(loc);
      const rawNumber = driver?.whatsapp || settings.whatsappNumber;
      const cleanNumber = rawNumber?.replace(/[^0-9]/g, '');

      let text = `Hello, I would like to book the *${loc.name}*. Price mentioned is ₹${loc.price}.`;
      if (vehicleName) text += ` Preferred Vehicle: ${vehicleName}.`;
      else if (vehicle) text += ` Vehicle: ${vehicle.name} (${vehicle.capacity} Seater).`;

      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleImageClick = (vehicleId: string, imgUrl: string) => {
      setActiveImages(prev => ({...prev, [vehicleId]: imgUrl}));
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
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6">Explore Gokarna & Beyond</h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                From local sightseeing to airport transfers, travel in comfort with our premium fleet.
            </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 space-y-20">
          
          {/* 2. FLEET SHOWCASE */}
          {vehicles.length > 0 && (
              <div className="animate-fade-in">
                  <div className="bg-white p-6 rounded-xl shadow-lg border-b-4 border-nature-600 mb-12">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                          <Car className="text-nature-600" /> Our Premium Fleet
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {vehicles.map(v => {
                             const activeImg = activeImages[v.id] || (v.images && v.images.length > 0 ? v.images[0] : 'https://via.placeholder.com/400x300?text=Vehicle');
                             return (
                                 <div key={v.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-gray-50">
                                     <div className="h-40 overflow-hidden relative">
                                         <img src={activeImg} className="w-full h-full object-cover" />
                                         <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1">{v.vehicleType}</div>
                                     </div>
                                     {/* Mini Gallery */}
                                     {v.images && v.images.length > 1 && (
                                          <div className="flex gap-1 p-1 bg-white overflow-x-auto">
                                              {v.images.map((img, i) => (
                                                  <img key={i} src={img} className={`w-8 h-8 rounded cursor-pointer border ${activeImg === img ? 'border-nature-600' : 'border-gray-200'}`} onClick={() => handleImageClick(v.id, img)} />
                                              ))}
                                          </div>
                                      )}
                                     <div className="p-3">
                                         <div className="flex justify-between items-center mb-1">
                                             <h3 className="font-bold text-gray-800">{v.name}</h3>
                                             <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">{v.capacity} Seater</span>
                                         </div>
                                         <div className="text-xs text-gray-500 flex flex-wrap gap-1 mb-3">
                                             {v.features.slice(0, 3).map((f, i) => <span key={i} className="bg-white border px-1 rounded">{f}</span>)}
                                         </div>
                                         <button onClick={() => handleBookVehicle(v)} className="w-full bg-nature-700 text-white text-xs font-bold py-2 rounded hover:bg-nature-800 flex items-center justify-center gap-1">Check Availability</button>
                                     </div>
                                 </div>
                             )
                          })}
                      </div>
                  </div>
              </div>
          )}

          {/* 3. SIGHTSEEING PACKAGES (RICH CARD LAYOUT) */}
          {Object.keys(sightseeing).length > 0 && (
              <div className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-8">
                      <div className="bg-nature-100 p-3 rounded-full text-nature-700"><Map size={24}/></div>
                      <div>
                          <h2 className="text-3xl font-bold text-gray-800">Sightseeing Packages</h2>
                          <p className="text-gray-500 text-sm">Explore the best of the coast with our curated day trips</p>
                      </div>
                  </div>

                  <div className="grid gap-8">
                      {Object.keys(sightseeing).map(name => {
                          const variants = sightseeing[name];
                          const mainDesc = variants[0].description;
                          
                          return (
                              <div key={name} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                                  {/* Image Section */}
                                  <div className="md:w-1/3 h-56 md:h-auto relative">
                                      <img src={variants[0].imageUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                          <h3 className="text-white font-bold text-2xl">{name}</h3>
                                      </div>
                                  </div>

                                  {/* Info Section */}
                                  <div className="p-6 md:w-2/3 flex flex-col">
                                      <div className="mb-6">
                                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Places Covered</h4>
                                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                              {mainDesc || 'Contact us for a detailed itinerary of this package.'}
                                          </p>
                                      </div>

                                      {/* Pricing Grid */}
                                      <div className="mt-auto">
                                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Tariff Chart</h4>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                              {variants.map(v => {
                                                  const vehicle = getVehicleForLocation(v);
                                                  return (
                                                      <div key={v.id} onClick={() => handleBookRide(v, vehicle?.name)} className="border border-gray-200 rounded-lg p-3 text-center hover:border-nature-500 hover:bg-nature-50 cursor-pointer transition-all group relative">
                                                          <div className="text-xs font-bold text-gray-500 group-hover:text-nature-700 mb-1">
                                                              {vehicle ? vehicle.vehicleType : 'Standard'}
                                                          </div>
                                                          <div className="text-lg font-bold text-gray-800">₹{v.price}</div>
                                                          <div className="text-[10px] text-gray-400">
                                                              {vehicle ? vehicle.name : 'View'}
                                                          </div>
                                                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-nature-600">
                                                              <MessageCircle size={14} />
                                                          </div>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}

          {/* 4. AIRPORT & TRANSFERS (✅ UPDATED: NOW USES RICH CARD LAYOUT) */}
          {Object.keys(transfers).length > 0 && (
              <div className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-8">
                      <div className="bg-blue-100 p-3 rounded-full text-blue-700"><Plane size={24}/></div>
                      <div>
                          <h2 className="text-3xl font-bold text-gray-800">Airport & Station Transfers</h2>
                          <p className="text-gray-500 text-sm">Reliable pick-up and drop services</p>
                      </div>
                  </div>

                  <div className="grid gap-8">
                      {Object.keys(transfers).map(name => {
                          const variants = transfers[name];
                          const mainDesc = variants[0].description;
                          
                          return (
                              <div key={name} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                                  {/* Image Section */}
                                  <div className="md:w-1/3 h-56 md:h-auto relative">
                                      <img src={variants[0].imageUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                                          <h3 className="text-white font-bold text-2xl">{name}</h3>
                                      </div>
                                  </div>

                                  {/* Info Section */}
                                  <div className="p-6 md:w-2/3 flex flex-col">
                                      <div className="mb-6">
                                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Service Details</h4>
                                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                              {mainDesc || 'One-way drop or pickup. Tolls and parking included.'}
                                          </p>
                                      </div>

                                      {/* Pricing Grid */}
                                      <div className="mt-auto">
                                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Vehicle Options & Rates</h4>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                              {variants.map(v => {
                                                  const vehicle = getVehicleForLocation(v);
                                                  return (
                                                      <div key={v.id} onClick={() => handleBookRide(v, vehicle?.name)} className="border border-gray-200 rounded-lg p-3 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group relative">
                                                          <div className="text-xs font-bold text-gray-500 group-hover:text-blue-700 mb-1">
                                                              {vehicle ? vehicle.vehicleType : 'Standard'}
                                                          </div>
                                                          <div className="text-lg font-bold text-gray-800">₹{v.price}</div>
                                                          <div className="text-[10px] text-gray-400">
                                                              {vehicle ? vehicle.name : 'View'}
                                                          </div>
                                                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                                                              <MessageCircle size={14} />
                                                          </div>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}

          {/* 5. LOCAL DROPS (Standard Grid) */}
          {Object.keys(localDrops).length > 0 && (
              <div className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-yellow-100 p-3 rounded-full text-yellow-700"><MapPin size={24}/></div>
                      <div>
                          <h2 className="text-3xl font-bold text-gray-800">Local Drops</h2>
                          <p className="text-gray-500 text-sm">Quick rides to beaches and temples</p>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.keys(localDrops).map(name => {
                          const variants = localDrops[name];
                          // Simple drop logic: Show starting price
                          const startPrice = variants[0].price;
                          
                          return (
                              <div key={name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                  <h3 className="font-bold text-gray-800 text-lg mb-1">{name}</h3>
                                  <p className="text-xs text-gray-400 mb-4">{variants[0].description || 'Local drop service'}</p>
                                  <div className="flex justify-between items-end">
                                      <div>
                                          <p className="text-xs text-gray-400 uppercase">Starts From</p>
                                          <p className="text-2xl font-bold text-nature-700">₹{startPrice}</p>
                                      </div>
                                      <button onClick={() => handleBookRide(variants[0])} className="bg-nature-100 text-nature-700 p-2 rounded-full hover:bg-nature-200">
                                          <MessageCircle size={20}/>
                                      </button>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}

          {/* Empty State */}
          {locations.length === 0 && vehicles.length === 0 && (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <Car size={48} className="mx-auto text-gray-300 mb-4" />
                 <p className="text-gray-500 text-lg">Transport options are being updated.</p>
             </div>
          )}
      </div>
    </div>
  );
};

export default Cabs;