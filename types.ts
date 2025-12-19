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