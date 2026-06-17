/**
 * ApnaGhar Real Estate Platform Types
 */

export enum UserRole {
  GUEST = 'GUEST',
  OWNER = 'OWNER',
  BUYER = 'BUYER',
  TENANT = 'TENANT',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  agency?: string;
  verified?: boolean;
  optedIn?: boolean;
}

export type PropertyPurpose = 'SELL' | 'RENT' | 'LEASE';

export type PropertyCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND';

export type FurnishingStatus = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';

export interface PropertyLocation {
  country: string;
  state: string;
  city: string;
  area: string;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  floors?: number; // Total floors in building
  floorNo?: number; // Specific floor number of unit
  area: number; // in sq ft
  furnishingStatus?: FurnishingStatus;
  facingDirection?: string; // Vastu facing direction
  waterSupply?: string; // municipal / borewell / 24hrs etc.
  gatedCommunity?: boolean;
  reraId?: string; // Real Estate Regulatory Authority register number
  propertyAge?: string; // age of the construction
  possessionStatus?: string; // Ready to Move / Under construction / New Launch
  flooringType?: string; // e.g. Marble, Vitrified Tiles, Granite, etc.
  nearbyLandmark?: string; // nearby significant landmark
}

export interface PropertyAmenities {
  parking: boolean;
  lift: boolean;
  swimmingPool: boolean;
  gym: boolean;
  garden: boolean;
  security24x7: boolean;
  cctv: boolean;
  powerBackup: boolean;
  internet: boolean;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  category: PropertyCategory;
  type: string; // e.g. Apartment, Villa, Office, Warehouse, plot, etc.
  purpose: PropertyPurpose;
  price: number;
  securityDeposit?: number;
  maintenanceCharges?: number;
  location: PropertyLocation;
  details: PropertyDetails;
  amenities: PropertyAmenities;
  images: string[]; // URLs or base64
  videoUrl?: string;
  virtualTourUrl?: string;
  floorPlanUrl?: string;
  documents?: {
    ownershipProof?: string;
    taxReceipt?: string;
    propertyCertificate?: string;
  };
  ownerId: string;
  ownerName: string;
  ownerType: 'OWNER' | 'AGENT';
  status: 'REJECTED' | 'PENDING' | 'APPROVED' | 'SOLD' | 'RENTED';
  moderationNotes?: string;
  auditHistory?: AuditLogEntry[];
  versions?: PropertyVersion[];
  views: number;
  leadsCount: number;
  sharesCount?: number;
  featured?: boolean;
  averageRating?: number | null;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyVersion {
  id: string; // unique version id
  title: string;
  description: string;
  price: number;
  status: 'REJECTED' | 'PENDING' | 'APPROVED' | 'SOLD' | 'RENTED';
  moderationNotes?: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  changedBy: string;
  notes?: string;
}

export interface Review {
  id: string;
  propertyId?: string;
  agentId?: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  ownerId: string;
  date: string;
  time: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  message?: string;
  offerPrice?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
   участник1Id: string; // Standard keys helper
  participantIds: string[];
  participantNames: { [userId: string]: string };
  lastMessageText: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'yearly';
  listingsLimit: number;
  features: string[];
}

export interface ContactInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  createdAt: string;
}

export type PromotionType = 'PROMOTIONAL' | 'FEATURED' | 'OFFER' | 'ADVERTISEMENT';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: PromotionType;
  imageUrl: string;
  badge?: string;
  linkUrl?: string; // Redirect link/filters e.g. "category:RESIDENTIAL" or "city:Mumbai" or "purpose:RENT"
  expiryDate?: string; // ISO string e.g. "2026-06-30" or empty
  active: boolean;
  createdAt: string;
}

