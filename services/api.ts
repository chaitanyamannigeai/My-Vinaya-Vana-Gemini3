
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

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

// Cache Buster Helper: Appends ?t=timestamp to URLs to force fresh fetch
const getUrl = (endpoint: string) => `${API_URL}${endpoint}?_t=${Date.now()}`;

export const api = {
    rooms: {
        getAll: async (): Promise<Room[]> => handleResponse(await fetch(getUrl('/rooms'))),
        save: async (room: Room) => handleResponse(await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(room)
        })),
        delete: async (id: string) => handleResponse(await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }))
    },
    bookings: {
        getAll: async (): Promise<Booking[]> => handleResponse(await fetch(getUrl('/bookings'))),
        add: async (booking: Booking) => handleResponse(await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        })),
        updateStatus: async (id: string, status: PaymentStatus) => handleResponse(await fetch(`${API_URL}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        }))
    },
    drivers: {
        getAll: async (): Promise<Driver[]> => handleResponse(await fetch(getUrl('/drivers'))),
        save: async (driver: Driver) => handleResponse(await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(driver)
        })),
        delete: async (id: string) => handleResponse(await fetch(`${API_URL}/drivers/${id}`, { method: 'DELETE' }))
    },
    locations: {
        getAll: async (): Promise<CabLocation[]> => handleResponse(await fetch(getUrl('/locations'))),
        save: async (location: CabLocation) => handleResponse(await fetch(`${API_URL}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location)
        })),
        delete: async (id: string) => handleResponse(await fetch(`${API_URL}/locations/${id}`, { method: 'DELETE' }))
    },
    settings: {
        get: async (): Promise<SiteSettings> => {
             try {
                const settings = await handleResponse(await fetch(getUrl('/settings')));
                // Merge with defaults in case DB is partial or empty
                return { ...DEFAULT_SETTINGS, ...settings, longStayDiscount: { ...DEFAULT_SETTINGS.longStayDiscount, ...(settings.longStayDiscount || {}) } };
             } catch (e) {
                 console.warn("Failed to fetch settings, using defaults", e);
                 return DEFAULT_SETTINGS;
             }
        },
        save: async (settings: SiteSettings) => handleResponse(await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        }))
    },
    gallery: {
        getAll: async (): Promise<GalleryItem[]> => handleResponse(await fetch(getUrl('/gallery'))),
        save: async (item: GalleryItem) => handleResponse(await fetch(`${API_URL}/gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        })),
        delete: async (id: string) => handleResponse(await fetch(`${API_URL}/gallery/${id}`, { method: 'DELETE' }))
    },
    reviews: {
        getAll: async (): Promise<Review[]> => handleResponse(await fetch(getUrl('/reviews'))),
        save: async (review: Review) => handleResponse(await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        })),
        delete: async (id: string) => handleResponse(await fetch(`${API_URL}/reviews/${id}`, { method: 'DELETE' }))
    },
    pricing: {
        getAll: async (): Promise<PricingRule[]> => handleResponse(await fetch(getUrl('/pricing'))),
        save: async (rule: PricingRule) => handleResponse(await fetch(`${API_URL}/pricing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
        })),
        delete: async (id: string) => handleResponse(await fetch(`${API_URL}/pricing/${id}`, { method: 'DELETE' }))
    }
};