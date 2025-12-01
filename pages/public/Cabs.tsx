
import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { CabLocation, Driver } from '../../types';
import { MapPin, Phone, MessageCircle, User, Car, Compass, ArrowRight, X, Search } from 'lucide-react';

const Cabs = () => {
  const [locations, setLocations] = useState<CabLocation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [selectedLocation, setSelectedLocation] = useState<CabLocation | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedLocs, fetchedDrivers, fetchedSettings] = await Promise.all([
            api.locations.getAll(),
            api.drivers.getAll(),
            api.settings.get()
        ]);
        setLocations(fetchedLocs.filter(l => l.active));
        setDrivers(fetchedDrivers);
        setSettings(fetchedSettings);
      } catch (err) {
          console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleLocationClick = (loc: CabLocation) => {
    setSelectedLocation(loc);
    
    // Determine driver: Specific > Default
    let driver: Driver | undefined;
    if (loc.driverId) {
      driver = drivers.find(d => d.id === loc.driverId);
    } 
    
    if (!driver) {
      driver = drivers.find(d => d.isDefault);
    }
    // Fallback to first active driver if no default
    if (!driver) {
      driver = drivers.find(d => d.active);
    }

    setAssignedDriver(driver || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    setAssignedDriver(null);
  };

  const getWhatsAppLink = (driver: Driver, loc: CabLocation) => {
    const message = `Hi, I am interested in booking a cab to ${loc.name} from Vinaya Vana.`;
    return `https://wa.me/${driver.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  const getCustomPackageLink = () => {
      const message = "Hi, I am interested in a custom multi-destination tour package from Vinaya Vana.";
      return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  // Filter locations based on search
  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-nature-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Cab Services</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore Gokarna and nearby attractions comfortably. Select a destination to contact our drivers directly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-nature-500 focus:border-nature-500 sm:text-sm shadow-sm"
                placeholder="Search destinations (e.g. Om Beach)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
                <div 
                key={loc.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
                onClick={() => handleLocationClick(loc)}
                >
                <div className="h-48 overflow-hidden relative">
                    <img 
                    src={loc.imageUrl} 
                    alt={loc.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all"></div>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-nature-800 mb-2">{loc.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{loc.description}</p>
                    <div className="flex items-center justify-between mt-4">
                    <span className="text-nature-600 font-medium text-sm bg-nature-50 px-3 py-1 rounded-full border border-nature-100">
                        {loc.price ? `₹${loc.price} approx` : 'Ask for Price'}
                    </span>
                    <span className="text-nature-500 flex items-center gap-1 text-sm">
                        Book Now <ArrowRight size={16} />
                    </span>
                    </div>
                </div>
                </div>
            ))
          ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                  <p>No locations found matching "{searchTerm}"</p>
              </div>
          )}
        </div>
        
        {/* Custom Package Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border-l-8 border-nature-500">
            <div className="md:w-2/3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-nature-100 p-3 rounded-full text-nature-600">
                        <Compass size={32} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-nature-900">Want to visit multiple places?</h2>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                    Create your own custom tour! Whether it's hopping between OM Beach and Kudle Beach, or a day trip covering Yana Caves and Murudeshwar, our drivers offer special package rates for multi-destination trips.
                </p>
            </div>
            <div className="md:w-1/3 w-full">
                <a 
                    href={getCustomPackageLink()}
                    target="_blank" 
                    rel="noreferrer"
                    className="block w-full text-center bg-nature-700 hover:bg-nature-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1"
                >
                    Request Custom Package
                </a>
                <p className="text-xs text-center mt-3 text-gray-400">Opens WhatsApp with our travel desk</p>
            </div>
        </div>

        {/* Driver Detail Modal */}
        {isModalOpen && selectedLocation && assignedDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="bg-nature-800 p-6 text-white relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-nature-200 hover:text-white">
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-serif font-bold">{selectedLocation.name}</h2>
                <p className="text-nature-200 text-sm mt-1">Travel Partner Details</p>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-nature-100 rounded-full flex items-center justify-center text-nature-600">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{assignedDriver.name}</h3>
                    {assignedDriver.vehicleInfo && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Car size={14} /> {assignedDriver.vehicleInfo}
                      </p>
                    )}
                    <p className="text-xs text-nature-600 bg-nature-50 inline-block px-2 py-0.5 rounded mt-1">
                      Trusted Driver
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <a 
                    href={getWhatsAppLink(assignedDriver, selectedLocation)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    <MessageCircle size={20} />
                    Chat on WhatsApp
                  </a>
                  
                  <a 
                    href={`tel:${assignedDriver.phone}`}
                    className="flex items-center justify-center gap-2 w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                  >
                    <Phone size={20} />
                    Call Driver
                  </a>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">
                    Pricing may vary based on season and demand. Discuss directly with the driver.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cabs;
