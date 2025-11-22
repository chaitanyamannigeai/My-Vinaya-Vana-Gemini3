
import { Room, Booking, Driver, CabLocation, SiteSettings, GalleryItem, PricingRule, Review, PaymentStatus } from '../types';

const API_URL = '/api';

// Default settings to use if DB is empty or for fallback
export const DEFAULT_SETTINGS: SiteSettings = {
  whatsappNumber: '919999999999',
  contactEmail: 'stay@vinayavana.com',
  address: 'Vinaya Vana Farmhouse\nGokarna, Karnataka 581326',
  razorpayKey: 'rzp_test_123456789',
  enableOnlinePayments: true,
  adminPasswordHash: 'admin123',
  heroImageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=1920',
  youtubeVideoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
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

// --- IN-MEMORY CACHE ---
// Stores API responses to make navigation instant
const cache: Record<string, any> = {};

const clearCache = () => {
    for (const key in cache) delete cache[key];
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// Optimized fetcher: Checks cache first for GET requests
const fetchWithCache = async (endpoint: string) => {
    if (cache[endpoint]) {
        return cache[endpoint];
    }
    const data = await handleResponse(await fetch(`${API_URL}${endpoint}`));
    cache[endpoint] = data;
    return data;
};

// Mutator: Sends data and clears cache to ensure freshness on next fetch
const mutate = async (endpoint: string, method: 'POST' | 'PUT' | 'DELETE', body?: any) => {
    clearCache(); // Clear cache on any change so user sees updates
    const options: RequestInit = {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
    };
    return handleResponse(await fetch(`${API_URL}${endpoint}`, options));
};

export const api = {
    auth: {
        login: async (password: string) => mutate('/auth/login', 'POST', { password })
    },
    rooms: {
        getAll: async (): Promise<Room[]> => fetchWithCache('/rooms'),
        save: async (room: Room) => mutate('/rooms', 'POST', room),
        delete: async (id: string) => mutate(`/rooms/${id}`, 'DELETE')
    },
    bookings: {
        getAll: async (): Promise<Booking[]> => fetchWithCache('/bookings'),
        add: async (booking: Booking) => mutate('/bookings', 'POST', booking),
        updateStatus: async (id: string, status: PaymentStatus) => mutate(`/bookings/${id}`, 'PUT', { status })
    },
    drivers: {
        getAll: async (): Promise<Driver[]> => fetchWithCache('/drivers'),
        save: async (driver: Driver) => mutate('/drivers', 'POST', driver),
        delete: async (id: string) => mutate(`/drivers/${id}`, 'DELETE')
    },
    locations: {
        getAll: async (): Promise<CabLocation[]> => fetchWithCache('/locations'),
        save: async (location: CabLocation) => mutate('/locations', 'POST', location),
        delete: async (id: string) => mutate(`/locations/${id}`, 'DELETE')
    },
    settings: {
        get: async (): Promise<SiteSettings> => {
             try {
                const settings = await fetchWithCache('/settings');
                // Merge with defaults in case DB is partial or empty
                return { ...DEFAULT_SETTINGS, ...settings, longStayDiscount: { ...DEFAULT_SETTINGS.longStayDiscount, ...(settings.longStayDiscount || {}) } };
             } catch (e) {
                 console.warn("Failed to fetch settings, using defaults", e);
                 return DEFAULT_SETTINGS;
             }
        },
        save: async (settings: SiteSettings) => mutate('/settings', 'POST', settings)
    },
    gallery: {
        getAll: async (): Promise<GalleryItem[]> => fetchWithCache('/gallery'),
        save: async (item: GalleryItem) => mutate('/gallery', 'POST', item),
        delete: async (id: string) => mutate(`/gallery/${id}`, 'DELETE')
    },
    reviews: {
        getAll: async (): Promise<Review[]> => fetchWithCache('/reviews'),
        save: async (review: Review) => mutate('/reviews', 'POST', review),
        delete: async (id: string) => mutate(`/reviews/${id}`, 'DELETE')
    },
    pricing: {
        getAll: async (): Promise<PricingRule[]> => fetchWithCache('/pricing'),
        save: async (rule: PricingRule) => mutate('/pricing', 'POST', rule),
        delete: async (id: string) => mutate(`/pricing/${id}`, 'DELETE')
    }
};