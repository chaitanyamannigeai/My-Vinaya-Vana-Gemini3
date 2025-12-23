// types.ts

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL', // Added PARTIAL
  FAILED = 'FAILED'
}

export interface Room {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  amenities: string[];
  images: string[];
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  
  // ✅ Payment Fields (Marked optional for safety)
  amountPaid?: number;
  balanceAmount?: number;
  
  status: PaymentStatus;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  isDefault: boolean;
  active: boolean;
  vehicleInfo?: string;
}

export interface CabLocation {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price?: number;
  driverId?: string | null;
  active: boolean;
}

export interface SiteSettings {
  whatsappNumber: string;
  contactEmail: string;
  address: string;
  razorpayKey: string;
  enableOnlinePayments: boolean;
  adminPasswordHash: string;
  heroImageUrl: string;
  youtubeVideoUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  googleMapUrl: string;
  
  longStayDiscount: {
    enabled: boolean;
    minDays: number;
    percentage: number;
  };
  advancePaymentPercentage?: number; // Added
  houseRules: string;
  weatherApiKey?: string;
  websiteHits?: number;
}

export interface GalleryItem {
  id: string;
  url: string;
  category: string;
  caption?: string;
}

export interface PricingRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  multiplier: number;
}

export interface Review {
  id: string;
  guestName: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  showOnHome: boolean;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}


// ✅ NEW: Represents a vehicle type offered (e.g., "Toyota Innova")
export interface CabVehicle {
  id: string;
  name: string;          // e.g., "Toyota Etios"
  vehicleType: string;   // e.g., "Sedan", "SUV", "Tempo Traveller"
  capacity: number;      // e.g., 4
  images: string[];      // Array of Supabase URLs
  features: string[];    // e.g., ["AC", "Carrier", "Music System"]
  baseRate?: number;     // Optional: For display (e.g. "12" -> "Rs 12/km")
  active: boolean;
}

// ✅ UPDATE: Driver (No breaking changes, just preparation)
// We will eventually link drivers to vehicles in Chunk 5.
export interface Driver {
  // ... existing fields ...
  assignedVehicleId?: string | null; // Optional link to a CabVehicle
}