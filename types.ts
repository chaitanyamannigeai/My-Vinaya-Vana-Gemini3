
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
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
  driverId?: string | null; // If null, use default driver
  active: boolean;
}

export interface SiteSettings {
  whatsappNumber: string;
  contactEmail: string;
  razorpayKey: string;
  enableOnlinePayments: boolean;
  adminPasswordHash: string;
  heroImageUrl: string;
  youtubeVideoUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  googleMapUrl: string;
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
  multiplier: number; // e.g., 1.5 for 50% increase
}

export interface Review {
  id: string;
  guestName: string;
  location: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  showOnHome: boolean;
}
