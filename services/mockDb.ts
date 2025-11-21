
import { Room, Booking, Driver, CabLocation, SiteSettings, GalleryItem, PaymentStatus, PricingRule, Review } from '../types';

// Initial Data Seeding
const INITIAL_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Luxury 2BHK Apartment',
    description: 'A fully furnished upper-floor apartment overlooking the coconut grove.',
    basePrice: 4500,
    capacity: 6,
    amenities: ['AC Bedrooms', 'Full Kitchen', 'Leg Massager', 'Geysers', 'Wi-Fi', 'Sit-out Area'],
    images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1522771753033-6321678e5c88?auto=format&fit=crop&q=80&w=800']
  }
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Ramesh (Main)', phone: '919876543210', whatsapp: '919876543210', isDefault: true, active: true, vehicleInfo: 'Innova Crysta' },
  { id: 'd2', name: 'Suresh', phone: '919876543211', whatsapp: '919876543211', isDefault: false, active: true, vehicleInfo: 'Swift Dzire' }
];

const INITIAL_LOCATIONS: CabLocation[] = [
  { id: 'l1', name: 'Gokarna Main Beach', description: 'Famous for Mahabaleshwar Temple and pristine sands.', imageUrl: 'https://images.unsplash.com/photo-1590664095612-2d4e5e0a8d7a?auto=format&fit=crop&q=80&w=400', price: 400, driverId: null, active: true },
  { id: 'l2', name: 'Om Beach', description: 'Shaped like the Om symbol, perfect for water sports.', imageUrl: 'https://images.unsplash.com/photo-1582475323030-d1f25385d858?auto=format&fit=crop&q=80&w=400', price: 500, driverId: null, active: true },
  { id: 'l3', name: 'Murudeshwar', description: 'Tallest Shiva statue and beautiful temple complex.', imageUrl: 'https://images.unsplash.com/photo-1620766165457-a8a48aaee06c?auto=format&fit=crop&q=80&w=400', price: 2500, driverId: 'd2', active: true }
];

const INITIAL_SETTINGS: SiteSettings = {
  whatsappNumber: '919999999999',
  contactEmail: 'stay@vinayavana.com',
  razorpayKey: 'rzp_test_123456789',
  enableOnlinePayments: true,
  adminPasswordHash: 'admin123',
  heroImageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=1920', // Coconut/Nature theme
  youtubeVideoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', // Example nature video
  facebookUrl: 'https://www.facebook.com/',
  instagramUrl: 'https://www.instagram.com/',
  googleMapUrl: 'https://maps.google.com/maps?q=14.519306,74.327528&z=15&output=embed',
  
  longStayDiscount: {
    enabled: true,
    minDays: 5,
    percentage: 20
  },
  houseRules: "Check-in time: 12:00 PM | Check-out time: 11:00 AM.\nGovt ID proof is mandatory for all guests.\nQuiet hours start from 10:00 PM.\nSmoking is not allowed inside the rooms.\nPets are not allowed.\nCancellation: 50% refund if cancelled 7 days prior."
};

const INITIAL_GALLERY: GalleryItem[] = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800', category: 'Property' },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800', category: 'Rooms' },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1523593385588-01871e6b329e?auto=format&fit=crop&q=80&w=800', category: 'Nature' },
];

const INITIAL_PRICING_RULES: PricingRule[] = [
  { id: 'pr1', name: 'December Peak', startDate: '2024-12-20', endDate: '2025-01-05', multiplier: 1.5 }
];

const INITIAL_REVIEWS: Review[] = [
  { id: 'rev1', guestName: 'Rahul Sharma', location: 'Bangalore', rating: 5, comment: 'An absolute gem in Gokarna! The coconut trees make it feel so secluded and peaceful. The leg massager was a nice touch after the trek.', date: '2023-11-15', showOnHome: true },
  { id: 'rev2', guestName: 'Sarah Jenkins', location: 'UK', rating: 5, comment: 'Perfect place for a family. The kitchen is well equipped and the hosts are wonderful. Very close to the beaches yet quiet.', date: '2024-01-20', showOnHome: true },
  { id: 'rev3', guestName: 'Amit & Priya', location: 'Mumbai', rating: 4, comment: 'Lovely stay. The cab service was very convenient for visiting Murudeshwar. Will definitely visit again.', date: '2024-02-10', showOnHome: true }
];

// LocalStorage Keys
const KEYS = {
  ROOMS: 'vv_rooms',
  BOOKINGS: 'vv_bookings',
  DRIVERS: 'vv_drivers',
  LOCATIONS: 'vv_locations',
  SETTINGS: 'vv_settings',
  GALLERY: 'vv_gallery',
  PRICING: 'vv_pricing',
  REVIEWS: 'vv_reviews'
};

// Helper to load or seed
const load = <T,>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const save = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  rooms: {
    getAll: () => load<Room[]>(KEYS.ROOMS, INITIAL_ROOMS),
    save: (rooms: Room[]) => save(KEYS.ROOMS, rooms),
    getById: (id: string) => load<Room[]>(KEYS.ROOMS, INITIAL_ROOMS).find(r => r.id === id),
  },
  bookings: {
    getAll: () => load<Booking[]>(KEYS.BOOKINGS, []),
    add: (booking: Booking) => {
      const bookings = load<Booking[]>(KEYS.BOOKINGS, []);
      bookings.push(booking);
      save(KEYS.BOOKINGS, bookings);
    },
    updateStatus: (id: string, status: PaymentStatus) => {
      const bookings = load<Booking[]>(KEYS.BOOKINGS, []);
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookings[idx].status = status;
        save(KEYS.BOOKINGS, bookings);
      }
    },
    checkAvailability: (roomId: string, checkIn: string, checkOut: string): boolean => {
        const bookings = load<Booking[]>(KEYS.BOOKINGS, []);
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();

        const roomBookings = bookings.filter(b => b.roomId === roomId && b.status !== PaymentStatus.FAILED);

        for (const b of roomBookings) {
            const bStart = new Date(b.checkIn).getTime();
            const bEnd = new Date(b.checkOut).getTime();
            if (start < bEnd && end > bStart) {
                return false; 
            }
        }
        return true;
    }
  },
  drivers: {
    getAll: () => load<Driver[]>(KEYS.DRIVERS, INITIAL_DRIVERS),
    save: (drivers: Driver[]) => save(KEYS.DRIVERS, drivers),
    getDefault: () => load<Driver[]>(KEYS.DRIVERS, INITIAL_DRIVERS).find(d => d.isDefault) || INITIAL_DRIVERS[0],
    getById: (id: string) => load<Driver[]>(KEYS.DRIVERS, INITIAL_DRIVERS).find(d => d.id === id),
  },
  locations: {
    getAll: () => load<CabLocation[]>(KEYS.LOCATIONS, INITIAL_LOCATIONS),
    save: (locs: CabLocation[]) => save(KEYS.LOCATIONS, locs),
  },
  settings: {
    get: () => load<SiteSettings>(KEYS.SETTINGS, INITIAL_SETTINGS),
    save: (settings: SiteSettings) => save(KEYS.SETTINGS, settings),
  },
  gallery: {
    getAll: () => load<GalleryItem[]>(KEYS.GALLERY, INITIAL_GALLERY),
    save: (items: GalleryItem[]) => save(KEYS.GALLERY, items),
  },
  pricing: {
    getAll: () => load<PricingRule[]>(KEYS.PRICING, INITIAL_PRICING_RULES),
    save: (rules: PricingRule[]) => save(KEYS.PRICING, rules),
    getMultiplierForDate: (date: string): number => {
        const rules = load<PricingRule[]>(KEYS.PRICING, INITIAL_PRICING_RULES);
        const d = new Date(date).getTime();
        let maxMultiplier = 1;

        rules.forEach(rule => {
            const start = new Date(rule.startDate).getTime();
            const end = new Date(rule.endDate).getTime();
            if (d >= start && d <= end) {
                if (rule.multiplier > maxMultiplier) {
                    maxMultiplier = rule.multiplier;
                }
            }
        });
        return maxMultiplier;
    }
  },
  reviews: {
    getAll: () => load<Review[]>(KEYS.REVIEWS, INITIAL_REVIEWS),
    save: (reviews: Review[]) => save(KEYS.REVIEWS, reviews),
    getHomeReviews: () => load<Review[]>(KEYS.REVIEWS, INITIAL_REVIEWS).filter(r => r.showOnHome)
  }
};
