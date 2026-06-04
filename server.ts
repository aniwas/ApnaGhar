import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { SAMPLE_PROPERTIES } from './src/data.js';
import { Property, Booking, Review, ChatMessage, ChatConversation, UserRole } from './src/types.js';

// Setup local persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure db exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Types for alerts and email notifications
export interface SearchAlert {
  id: string;
  email: string;
  city: string;
  maxPrice?: number;
  category?: string;
  createdAt: string;
}

export interface MockEmailNotification {
  id: string;
  email: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  optedIn?: boolean;
}

export interface VoiceInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  clientEmail: string;
  transcription: string;
  audioUrl?: string;
  createdAt: string;
}

export interface MasterAmenity {
  id: string;
  label: string;
  active: boolean;
}

interface CommunityVibe {
  id: string;
  propertyId: string;
  reviewerName: string;
  category: string;
  comment: string;
  rating: number;
  createdAt: string;
}

interface TenantScreening {
  id: string;
  applicantName: string;
  applicantEmail: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  creditScore?: number;
  criminalRecord?: string;
  evictionHistory?: string;
  employmentStatus?: string;
  incomeRatio?: number;
  recommendation?: string;
  createdAt: string;
}

let dbData: {
  properties: Property[];
  bookings: Booking[];
  reviews: Review[];
  conversations: ChatConversation[];
  alerts: SearchAlert[];
  notifications: MockEmailNotification[];
  users: ServerUser[];
  voiceInquiries: VoiceInquiry[];
  amenities: MasterAmenity[];
  communityVibes: CommunityVibe[];
  tenantScreenings: TenantScreening[];
} = {
  properties: SAMPLE_PROPERTIES,
  bookings: [],
  voiceInquiries: [],
  communityVibes: [],
  tenantScreenings: [],
  amenities: [
    { id: 'parking', label: 'Reserved Parking', active: true },
    { id: 'lift', label: 'Speed Lift', active: true },
    { id: 'swimmingPool', label: 'Swimming Pool', active: true },
    { id: 'gym', label: 'Fitness Gym', active: true },
    { id: 'garden', label: 'Leisure Garden', active: true },
    { id: 'security24x7', label: '24/7 Security guarding', active: true },
    { id: 'cctv', label: 'CCTV Radar', active: true },
    { id: 'powerBackup', label: 'Power Backup', active: true },
    { id: 'internet', label: 'Fiber Internet', active: true }
  ],
  reviews: [
    {
      id: 'rev-1',
      propertyId: 'prop-1',
      reviewerId: 'buyer-demo',
      reviewerName: 'Anil Vasudevan',
      rating: 5,
      comment: 'Absolutely stunning views. Worth every rupee! The virtual tour of the penthouse was incredibly immersive and matched the actual site perfectly.',
      createdAt: '2026-06-01T15:00:00Z'
    },
    {
      id: 'rev-2',
      propertyId: 'prop-3',
      reviewerId: 'tenant-demo',
      reviewerName: 'Karan Mehra',
      rating: 4,
      comment: 'Excellent property situated in a highly clean and peaceful society. Rajesh Malhotra was very helpful in coordinating our visit.',
      createdAt: '2026-06-02T10:00:00Z'
    }
  ],
  conversations: [],
  alerts: [
    {
      id: 'alert-initial',
      email: 'aniwas111@gmail.com',
      city: 'Mumbai',
      maxPrice: 60000000,
      category: 'RESIDENTIAL',
      createdAt: '2026-06-02T22:00:00Z'
    }
  ],
  notifications: [
    {
      id: 'notif-initial',
      email: 'aniwas111@gmail.com',
      subject: '✨ ApnaGhar Alert Match: Luxury Sea View Penthouse listed!',
      body: 'Namaste! A new property matching your saved alert (Mumbai, under ₹6 Crore) has been listed:\n\nTitle: Sea-Facing 4BHK Penthouse\nCity: Mumbai\nLiving Area: Bandra West\nPrice: ₹5,50,00,000\n\nVisit ApnaGhar today to book an interactive site tour.',
      createdAt: '2026-06-02T22:05:00Z'
    }
  ],
  users: [
    {
      id: 'aniwas111@gmail.com',
      name: 'Anil Vasudevan',
      email: 'aniwas111@gmail.com',
      role: UserRole.ADMIN,
      phone: '+91 98765 43210',
      optedIn: true
    },
    {
      id: 'rajesh@apnaghar.com',
      name: 'Rajesh Malhotra',
      email: 'rajesh@apnaghar.com',
      role: UserRole.AGENT,
      phone: '+91 91234 56789',
      optedIn: true
    },
    {
      id: 'priya@gmail.com',
      name: 'Priya Sharma',
      email: 'priya@gmail.com',
      role: UserRole.BUYER,
      phone: '+91 98123 45678',
      optedIn: true
    },
    {
      id: 'karan@gmail.com',
      name: 'Karan Mehra',
      email: 'karan@gmail.com',
      role: UserRole.TENANT,
      phone: '+91 88888 77777',
      optedIn: true
    },
    {
      id: 'suresh@gmail.com',
      name: 'Suresh Kumar',
      email: 'suresh@gmail.com',
      role: UserRole.OWNER,
      phone: '+91 77777 66666',
      optedIn: true
    }
  ]
};

if (fs.existsSync(DB_PATH)) {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    dbData = JSON.parse(raw);
    if (!dbData.alerts) dbData.alerts = [];
    if (!dbData.notifications) dbData.notifications = [];
    if (!dbData.voiceInquiries) dbData.voiceInquiries = [];
    if (!dbData.communityVibes || dbData.communityVibes.length === 0) {
      dbData.communityVibes = [
        {
          id: 'vibe-1',
          propertyId: 'prop-1',
          reviewerName: 'Meera Rao (Bandra Resident)',
          category: 'Transport & Commute',
          comment: 'Perfect transit links here! The Bandra suburban train station is barely a 6-minute auto ride. Share-cabs are readily available, and there are direct, non-congested highways to BKC.',
          rating: 5,
          createdAt: '2026-05-28T09:12:00Z'
        },
        {
          id: 'vibe-2',
          propertyId: 'prop-1',
          reviewerName: 'Anshul Singhania',
          category: 'Safety & Vigilance',
          comment: 'Quiet, well-patrolled, and fully lighted lanes of an evening. Perfect for late-night walks or families with pets.',
          rating: 5,
          createdAt: '2026-05-30T14:40:00Z'
        },
        {
          id: 'vibe-3',
          propertyId: 'prop-1',
          reviewerName: 'Kabir Dev',
          category: 'Food, Dining & Parks',
          comment: 'Outstanding eateries, bakeries, and organic cafes within walking distance. Carter Road promenade is just a stone\'s throw away for running.',
          rating: 4,
          createdAt: '2025-06-01T11:05:00Z'
        },
        {
          id: 'vibe-4',
          propertyId: 'prop-2',
          reviewerName: 'Sneha Chawla',
          category: 'Transport & Commute',
          comment: 'The Metro-Line 3 station entrance is right around the block. Simplifies travel down to South Bombay tremendously.',
          rating: 4,
          createdAt: '2026-05-25T16:20:00Z'
        },
        {
          id: 'vibe-5',
          propertyId: 'prop-3',
          reviewerName: 'Rohan Deshmukh',
          category: 'Noise & Serenity',
          comment: 'Extremely silent residential area. No major street sirens or wedding banquets nearby, allowing peace during work-from-home.',
          rating: 5,
          createdAt: '2026-05-18T10:00:00Z'
        }
      ];
    }
    if (!dbData.tenantScreenings || dbData.tenantScreenings.length === 0) {
      dbData.tenantScreenings = [
        {
          id: 'screen-1',
          applicantName: 'Aditya Sen',
          applicantEmail: 'aditya.sen@gmail.com',
          propertyId: 'prop-2',
          propertyTitle: 'Breathtaking 2BHK Glasshouse',
          ownerId: 'owner-demo',
          status: 'COMPLETED',
          creditScore: 785,
          criminalRecord: 'No criminal records found (Nationwide checking clear)',
          evictionHistory: 'No prior eviction records registered',
          employmentStatus: 'Verified - Tech Lead at Google India',
          incomeRatio: 4.5,
          recommendation: 'Highly Recommended',
          createdAt: '2026-06-01T14:30:00Z'
        },
        {
          id: 'screen-2',
          applicantName: 'Neha Kapoor',
          applicantEmail: 'neha.kp@yahoo.com',
          propertyId: 'prop-3',
          propertyTitle: 'Cozy Semi-Furnished Studio',
          ownerId: 'owner-demo',
          status: 'COMPLETED',
          creditScore: 615,
          criminalRecord: 'No criminal records found (Checked 34 state registers)',
          evictionHistory: '1 prior eviction record from 2022 (Tenant resolved full escrow credit disputes)',
          employmentStatus: 'Verified - Freelance Designer',
          incomeRatio: 2.8,
          recommendation: 'Recommended with Multi-Month Security Deposit',
          createdAt: '2026-06-02T11:15:00Z'
        }
      ];
    }
    if (!dbData.amenities || dbData.amenities.length === 0) {
      dbData.amenities = [
        { id: 'parking', label: 'Reserved Parking', active: true },
        { id: 'lift', label: 'Speed Lift', active: true },
        { id: 'swimmingPool', label: 'Swimming Pool', active: true },
        { id: 'gym', label: 'Fitness Gym', active: true },
        { id: 'garden', label: 'Leisure Garden', active: true },
        { id: 'security24x7', label: '24/7 Security guarding', active: true },
        { id: 'cctv', label: 'CCTV Radar', active: true },
        { id: 'powerBackup', label: 'Power Backup', active: true },
        { id: 'internet', label: 'Fiber Internet', active: true }
      ];
    }
    if (!dbData.users) {
      dbData.users = [
        {
          id: 'aniwas111@gmail.com',
          name: 'Anil Vasudevan',
          email: 'aniwas111@gmail.com',
          role: UserRole.ADMIN,
          phone: '+91 98765 43210',
          optedIn: true
        },
        {
          id: 'rajesh@apnaghar.com',
          name: 'Rajesh Malhotra',
          email: 'rajesh@apnaghar.com',
          role: UserRole.AGENT,
          phone: '+91 91234 56789',
          optedIn: true
        },
        {
          id: 'priya@gmail.com',
          name: 'Priya Sharma',
          email: 'priya@gmail.com',
          role: UserRole.BUYER,
          phone: '+91 98123 45678',
          optedIn: true
        },
        {
          id: 'karan@gmail.com',
          name: 'Karan Mehra',
          email: 'karan@gmail.com',
          role: UserRole.TENANT,
          phone: '+91 88888 77777',
          optedIn: true
        },
        {
          id: 'suresh@gmail.com',
          name: 'Suresh Kumar',
          email: 'suresh@gmail.com',
          role: UserRole.OWNER,
          phone: '+91 77777 66666',
          optedIn: true
        }
      ];
    }
  } catch (err) {
    console.error('Error reading persistent database. Re-initializing...', err);
  }
} else {
  fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database: ', err);
  }
}

function generateSitemapXML() {
  try {
    const properties = dbData.properties.filter(p => p.status === 'APPROVED' || p.status === 'SOLD' || p.status === 'RENTED');
    const baseUrl = 'https://apnaghar.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Home
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // 2. Active property specific listings
    properties.forEach(p => {
      const lastModDate = p.updatedAt ? p.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/property/${p.id}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    const filepath = path.join(process.cwd(), 'sitemap.xml');
    fs.writeFileSync(filepath, xml, 'utf-8');
    console.log(`[ApnaGhar] Successfully auto-generated XML Sitemap with ${properties.length} active listings at ${filepath}`);
  } catch (err) {
    console.error('[ApnaGhar] Error generating sitemap XML file:', err);
  }
}

// Lazy initialization helper for Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY environment variable is not configured or still has default placeholder value.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Auto-generate XML sitemap on boot
  generateSitemapXML();

  // Middleware for parsing requests
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API ROUTES ---

  // 0. Amenities Management API (Managed by Admin)
  app.get('/api/amenities', (req, res) => {
    res.json(dbData.amenities || []);
  });

  app.post('/api/amenities', (req, res) => {
    const { label, id, active } = req.body;
    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }
    const amenityId = id || label.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check if duplicate
    const existing = dbData.amenities.find(a => a.id === amenityId);
    if (existing) {
      existing.label = label;
      existing.active = active !== undefined ? !!active : existing.active;
    } else {
      dbData.amenities.push({
        id: amenityId,
        label,
        active: active !== undefined ? !!active : true
      });
    }
    saveDB();
    res.json({ success: true, amenities: dbData.amenities });
  });

  app.put('/api/amenities/:id', (req, res) => {
    const { id } = req.params;
    const { label, active } = req.body;
    const item = dbData.amenities.find(a => a.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Amenity not found' });
    }
    if (label !== undefined) item.label = label;
    if (active !== undefined) item.active = !!active;
    saveDB();
    res.json({ success: true, amenity: item, amenities: dbData.amenities });
  });

  app.delete('/api/amenities/:id', (req, res) => {
    const { id } = req.params;
    dbData.amenities = dbData.amenities.filter(a => a.id !== id);
    saveDB();
    res.json({ success: true, amenities: dbData.amenities });
  });

  // 1. Properties API
  app.get('/api/properties', (req, res) => {
    let list = dbData.properties.map(p => {
      const propRevs = dbData.reviews.filter(r => r.propertyId === p.id);
      const averageRating = propRevs.length > 0
        ? Number((propRevs.reduce((acc, r) => acc + r.rating, 0) / propRevs.length).toFixed(1))
        : null;
      const reviewsCount = propRevs.length;
      return { ...p, averageRating, reviewsCount };
    });
    const { category, purpose, city, type, minPrice, maxPrice, bedrooms, search, ownerId } = req.query;

    if (category) {
      list = list.filter(p => p.category === category);
    }
    if (purpose) {
      list = list.filter(p => p.purpose === purpose);
    }
    if (city) {
      list = list.filter(p => p.location.city.toLowerCase() === (city as string).toLowerCase());
    }
    if (type) {
      list = list.filter(p => p.type.toLowerCase() === (type as string).toLowerCase());
    }
    if (minPrice) {
      list = list.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter(p => p.price <= Number(maxPrice));
    }
    if (bedrooms) {
      list = list.filter(p => p.details.bedrooms === Number(bedrooms));
    }
    if (ownerId) {
      list = list.filter(p => p.ownerId === ownerId);
    }
    if (search) {
      const s = (search as string).toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(s) || 
        p.description.toLowerCase().includes(s) ||
        p.location.area.toLowerCase().includes(s) ||
        p.location.city.toLowerCase().includes(s)
      );
    }

    res.json(list);
  });

  app.get('/api/properties/:id', (req, res) => {
    const prop = dbData.properties.find(p => p.id === req.params.id);
    if (!prop) {
      return res.status(404).json({ error: 'Property not found' });
    }
    // Increment view count dynamically
    prop.views = (prop.views || 0) + 1;
    saveDB();

    const propRevs = dbData.reviews.filter(r => r.propertyId === prop.id);
    const averageRating = propRevs.length > 0 
      ? Number((propRevs.reduce((acc, r) => acc + r.rating, 0) / propRevs.length).toFixed(1)) 
      : null;
    const reviewsCount = propRevs.length;

    res.json({ ...prop, averageRating, reviewsCount });
  });

  app.post('/api/properties', (req, res) => {
    const data = req.body;
    if (!data.title || !data.category || !data.price) {
      return res.status(400).json({ error: 'Missing mandatory property fields.' });
    }

    const newProp: Property = {
      id: `prop-${Date.now()}`,
      title: data.title,
      description: data.description || 'No description provided.',
      category: data.category,
      type: data.type || 'Apartment',
      purpose: data.purpose || 'SELL',
      price: Number(data.price),
      securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : undefined,
      maintenanceCharges: data.maintenanceCharges ? Number(data.maintenanceCharges) : undefined,
      location: {
        country: data.location?.country || 'India',
        state: data.location?.state || '',
        city: data.location?.city || '',
        area: data.location?.area || '',
        address: data.location?.address || '',
        postalCode: data.location?.postalCode || '',
        latitude: Number(data.location?.latitude) || 19.0760,
        longitude: Number(data.location?.longitude) || 72.8777
      },
      details: {
        bedrooms: data.details?.bedrooms ? Number(data.details?.bedrooms) : undefined,
        bathrooms: data.details?.bathrooms ? Number(data.details?.bathrooms) : undefined,
        balconies: data.details?.balconies ? Number(data.details?.balconies) : undefined,
        floors: data.details?.floors ? Number(data.details?.floors) : undefined,
        floorNo: data.details?.floorNo ? Number(data.details?.floorNo) : undefined,
        area: Number(data.details?.area || 1000),
        furnishingStatus: data.details?.furnishingStatus,
        facingDirection: data.details?.facingDirection,
        waterSupply: data.details?.waterSupply,
        gatedCommunity: data.details?.gatedCommunity !== undefined ? !!data.details?.gatedCommunity : undefined,
        reraId: data.details?.reraId,
        propertyAge: data.details?.propertyAge,
        possessionStatus: data.details?.possessionStatus,
        flooringType: data.details?.flooringType,
        nearbyLandmark: data.details?.nearbyLandmark
      },
      amenities: (() => {
        const ams: any = {};
        if (dbData.amenities) {
          dbData.amenities.forEach(am => {
            ams[am.id] = !!data.amenities?.[am.id];
          });
        }
        if (data.amenities) {
          Object.keys(data.amenities).forEach(k => {
            if (!(k in ams)) {
              ams[k] = !!data.amenities[k];
            }
          });
        }
        return ams;
      })(),
      images: data.images && data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200'
      ],
      videoUrl: data.videoUrl,
      virtualTourUrl: data.virtualTourUrl,
      floorPlanUrl: data.floorPlanUrl,
      documents: {
        ownershipProof: data.documents?.ownershipProof,
        taxReceipt: data.documents?.taxReceipt,
        propertyCertificate: data.documents?.propertyCertificate
      },
      ownerId: data.ownerId || 'owner-demo',
      ownerName: data.ownerName || 'Demo Host',
      ownerType: data.ownerType || 'OWNER',
      status: 'APPROVED', // Auto approved for streamlined preview UX
      views: 1,
      leadsCount: 0,
      featured: !!data.featured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Scan alert subscriptions and create mock email notifications
    if (dbData.alerts && dbData.alerts.length > 0) {
      const matchCategory = newProp.category;
      const matchCity = newProp.location.city.toLowerCase().trim();
      const matchPrice = newProp.price;

      dbData.alerts.forEach(alert => {
        const alertCity = alert.city ? alert.city.toLowerCase().trim() : '';
        const limitPrice = alert.maxPrice || Infinity;
        const alertCategory = alert.category || 'ALL';

        const cityMatches = !alertCity || alertCity === matchCity;
        const priceMatches = matchPrice <= limitPrice;
        const categoryMatches = alertCategory === 'ALL' || alertCategory === matchCategory;

        if (cityMatches && priceMatches && categoryMatches) {
          dbData.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random()}`,
            email: alert.email,
            subject: `✨ ApnaGhar Alert Match: New Listing in ${newProp.location.city}!`,
            body: `Greetings!\n\nA premium new property matching your alert criteria has been listed:\n\nTitle: ${newProp.title}\nCategory: ${newProp.category} (${newProp.type})\nPrice: ₹${newProp.price.toLocaleString('en-IN')}\nArea: ${newProp.location.area}, ${newProp.location.city}\n\nTap on details inside ApnaGhar to schedule a site tour!`,
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    dbData.properties.unshift(newProp);
    saveDB();
    generateSitemapXML();
    res.status(201).json(newProp);
  });

  app.put('/api/properties/:id', (req, res) => {
    const idx = dbData.properties.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const existing = dbData.properties[idx];
    const { status, moderationNotes, changedBy } = req.body;

    let updatedHistory = existing.auditHistory || [];
    if (status && status !== existing.status) {
      const entry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fromStatus: existing.status,
        toStatus: status,
        timestamp: new Date().toISOString(),
        changedBy: changedBy || 'Admin Executive',
        notes: moderationNotes || req.body.moderationNotes || ''
      };
      updatedHistory = [entry, ...updatedHistory];
    }

    // Email dispatch simulation
    if (status === 'REJECTED') {
      const emailObj = {
        id: `notif-${Date.now()}-${Math.random()}`,
        email: existing.ownerId === 'agent-1' || existing.ownerId === 'agent-demo' ? 'rajesh@malhotraestates.com' : 'owner@apnaghar.com',
        subject: `❌ Property Validation Rejected: ${existing.title}`,
        body: `Hello,\n\nWe regret to inform you that your property listing "${existing.title}" was not approved during our manual audit.\n\nReason for Rejection:\n${moderationNotes || req.body.moderationNotes || 'The listing details did not satisfy our validation guidelines. Please edit and resubmit.'}\n\nPlease click on the ApnaGhar dashboard to correct your details.\n\nBest regards,\nApnaGhar Compliance Team`,
        createdAt: new Date().toISOString()
      };
      dbData.notifications.unshift(emailObj);
    } else if (status === 'APPROVED') {
       const emailObj = {
         id: `notif-${Date.now()}-${Math.random()}`,
         email: existing.ownerId === 'agent-1' || existing.ownerId === 'agent-demo' ? 'rajesh@malhotraestates.com' : 'owner@apnaghar.com',
         subject: `🎉 Property Listing Approved: ${existing.title}`,
         body: `Greetings!\n\nYour property listing "${existing.title}" has been APPROVED and is now active on the ApnaGhar platform!\n\nBest regards,\nApnaGhar Compliance Team`,
         createdAt: new Date().toISOString()
       };
       dbData.notifications.unshift(emailObj);
    }

    const updated = {
      ...existing,
      ...req.body,
      auditHistory: updatedHistory,
      id: existing.id, // Immutable
      updatedAt: new Date().toISOString()
    };

    dbData.properties[idx] = updated;
    saveDB();
    res.json(updated);
  });

  app.post('/api/properties/bulk-moderation', (req, res) => {
    const { ids, status, moderationNotes, changedBy } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ error: 'Property ids (array) and target status are required.' });
    }

    const updatedListings: any[] = [];
    
    ids.forEach(id => {
      const idx = dbData.properties.findIndex(p => p.id === id);
      if (idx !== -1) {
        const existing = dbData.properties[idx];
        let updatedHistory = existing.auditHistory || [];
        
        if (status !== existing.status) {
          const entry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            fromStatus: existing.status,
            toStatus: status,
            timestamp: new Date().toISOString(),
            changedBy: changedBy || 'Admin Executive',
            notes: moderationNotes || ''
          };
          updatedHistory = [entry, ...updatedHistory];
        }

        if (status === 'REJECTED') {
          dbData.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random()}`,
            email: 'broker-compliance@apnaghar.com',
            subject: `❌ Bulk Rejection notification: ${existing.title}`,
            body: `Hello,\n\nWe regret to inform you that your property listing "${existing.title}" was rejected during an administrative bulk action.\n\nReason: ${moderationNotes || 'Administrative bulk audit cleanup.'}\n\nCompliance Team`,
            createdAt: new Date().toISOString()
          });
        } else if (status === 'APPROVED') {
          dbData.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random()}`,
            email: 'broker-compliance@apnaghar.com',
            subject: `🎉 Bulk Approval notification: ${existing.title}`,
            body: `Hello,\n\nWe are pleased to inform you that your property "${existing.title}" is approved and active.`,
            createdAt: new Date().toISOString()
          });
        }

        const updated = {
          ...existing,
          status,
          moderationNotes: moderationNotes || existing.moderationNotes,
          auditHistory: updatedHistory,
          updatedAt: new Date().toISOString()
        };

        dbData.properties[idx] = updated;
        updatedListings.push(updated);
      }
    });

    saveDB();
    generateSitemapXML();
    res.json({ success: true, updatedCount: updatedListings.length });
  });

  app.delete('/api/properties/:id', (req, res) => {
    const idx = dbData.properties.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }
    dbData.properties.splice(idx, 1);
    saveDB();
    generateSitemapXML();
    res.json({ success: true });
  });

  // Share tracking API
  app.post('/api/properties/:id/share', (req, res) => {
    const prop = dbData.properties.find(p => p.id === req.params.id);
    if (!prop) {
      return res.status(404).json({ error: 'Property not found' });
    }
    prop.sharesCount = (prop.sharesCount || 0) + 1;
    saveDB();
    res.json({ success: true, sharesCount: prop.sharesCount });
  });

  // 2. Reviews API
  app.get('/api/properties/:id/reviews', (req, res) => {
    const revs = dbData.reviews.filter(r => r.propertyId === req.params.id);
    res.json(revs);
  });

  app.post('/api/properties/:id/reviews', (req, res) => {
    const { reviewerName, rating, comment, reviewerId } = req.body;
    if (!reviewerName || !rating || !comment) {
      return res.status(400).json({ error: 'Name, Rating and Comments are required.' });
    }

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      propertyId: req.params.id,
      reviewerId: reviewerId || `user-${Date.now()}`,
      reviewerName,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    dbData.reviews.unshift(newRev);
    saveDB();
    res.status(201).json(newRev);
  });

  // 2c. Voice Inquiries API
  app.get('/api/properties/:id/voice-inquiries', (req, res) => {
    const propertyId = req.params.id;
    const email = req.query.email as string;
    let filtered = dbData.voiceInquiries.filter(i => i.propertyId === propertyId);
    if (email) {
      filtered = filtered.filter(i => i.clientEmail === email);
    }
    res.json(filtered);
  });

  app.post('/api/properties/:id/voice-inquiry', (req, res) => {
    const propertyId = req.params.id;
    const { clientName, clientEmail, transcription, audioUrl } = req.body;
    if (!transcription) {
      return res.status(400).json({ error: 'Transcription is required.' });
    }
    const prop = dbData.properties.find(p => p.id === propertyId);
    if (!prop) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    prop.leadsCount = (prop.leadsCount || 0) + 1;
    const newInquiry: VoiceInquiry = {
      id: `vinq-${Date.now()}`,
      propertyId,
      propertyTitle: prop.title,
      clientName: clientName || 'Guest User',
      clientEmail: clientEmail || 'guest@apnaghar.com',
      transcription,
      audioUrl: audioUrl || '',
      createdAt: new Date().toISOString()
    };
    dbData.voiceInquiries.unshift(newInquiry);
    saveDB();
    res.status(201).json(newInquiry);
  });

  // 2b. Agent Reviews API
  app.get('/api/agents/:id/reviews', (req, res) => {
    const revs = dbData.reviews.filter(r => r.agentId === req.params.id);
    res.json(revs);
  });

  app.post('/api/agents/:id/reviews', (req, res) => {
    const { reviewerName, rating, comment, reviewerId } = req.body;
    if (!reviewerName || !rating || !comment) {
      return res.status(400).json({ error: 'Name, Rating and Comments are required.' });
    }

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      agentId: req.params.id,
      reviewerId: reviewerId || `user-${Date.now()}`,
      reviewerName,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    dbData.reviews.unshift(newRev);
    saveDB();
    res.status(201).json(newRev);
  });

  // 2c. Alert Subscriptions API
  app.post('/api/alerts', (req, res) => {
    const { email, city, maxPrice, category } = req.body;
    if (!email || !city) {
      return res.status(400).json({ error: 'Email and Location City are required to set up search criteria alerts.' });
    }

    const alertItem = {
      id: `alert-${Date.now()}`,
      email,
      city,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      category: category || 'ALL',
      createdAt: new Date().toISOString()
    };

    dbData.alerts = dbData.alerts || [];
    dbData.alerts.unshift(alertItem);
    saveDB();
    res.status(201).json(alertItem);
  });

  app.get('/api/alerts', (req, res) => {
    const { email } = req.query;
    dbData.alerts = dbData.alerts || [];
    if (email) {
      const filtered = dbData.alerts.filter(a => a.email.toLowerCase() === (email as string).toLowerCase());
      return res.json(filtered);
    }
    res.json(dbData.alerts);
  });

  app.delete('/api/alerts/:id', (req, res) => {
    dbData.alerts = dbData.alerts || [];
    const idx = dbData.alerts.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Alert subscription not found' });
    }
    dbData.alerts.splice(idx, 1);
    saveDB();
    res.json({ success: true });
  });

  // 2d. Mock Email Notifications API
  app.get('/api/notifications', (req, res) => {
    const { email } = req.query;
    dbData.notifications = dbData.notifications || [];
    if (email) {
      const filtered = dbData.notifications.filter(n => n.email.toLowerCase() === (email as string).toLowerCase());
      return res.json(filtered);
    }
    res.json(dbData.notifications);
  });

  // 3. Bookings API
  app.get('/api/bookings', (req, res) => {
    const { userId, ownerId } = req.query;
    let list = [...dbData.bookings];

    if (userId) {
      list = list.filter(b => b.clientId === userId);
    }
    if (ownerId) {
      list = list.filter(b => b.ownerId === ownerId);
    }

    res.json(list);
  });

  app.post('/api/bookings', (req, res) => {
    const data = req.body;
    if (!data.propertyId || !data.date || !data.time) {
      return res.status(400).json({ error: 'Property, Date and Time are required.' });
    }

    const prop = dbData.properties.find(p => p.id === data.propertyId);
    if (!prop) {
      return res.status(404).json({ error: 'Corresponding property not found.' });
    }

    // Increment lead count on property creation booking
    prop.leadsCount = (prop.leadsCount || 0) + 1;

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      propertyId: data.propertyId,
      propertyTitle: prop.title,
      propertyImage: prop.images[0],
      clientId: data.clientId || 'buyer-demo',
      clientName: data.clientName || 'Anil Vasudevan',
      clientEmail: data.clientEmail || 'aniwas111@gmail.com',
      clientPhone: data.clientPhone || '+91 98765 43210',
      ownerId: prop.ownerId,
      date: data.date,
      time: data.time,
      status: 'PENDING',
      message: data.message,
      createdAt: new Date().toISOString()
    };

    dbData.bookings.unshift(newBooking);
    saveDB();
    res.status(201).json(newBooking);
  });

  app.put('/api/bookings/:id/status', (req, res) => {
    const booking = dbData.bookings.find(b => b.id === req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking slot not found.' });
    }

    booking.status = req.body.status || booking.status;
    saveDB();
    res.json(booking);
  });

  // 4. Chat & Messages API
  app.get('/api/conversations', (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required.' });
    }

    const filteredConvs = dbData.conversations.filter(c => 
      c.participantIds.includes(userId as string)
    );
    res.json(filteredConvs);
  });

  app.post('/api/chat/send', (req, res) => {
    const { senderId, senderName, receiverId, receiverName, text, propertyId, propertyTitle } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ error: 'senderId, receiverId, and text are required.' });
    }

    // Find custom conversation
    let conv = dbData.conversations.find(c => 
      c.participantIds.includes(senderId) && c.participantIds.includes(receiverId) &&
      (!propertyId || c.propertyId === propertyId)
    );

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        propertyId,
        propertyTitle,
        участник1Id: senderId,
        participantIds: [senderId, receiverId],
        participantNames: {
          [senderId]: senderName || 'User',
          [receiverId]: receiverName || 'Agent/Owner'
        },
        lastMessageText: text,
        lastMessageAt: new Date().toISOString(),
        messages: []
      };
      dbData.conversations.push(conv);
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: conv.id,
      senderId,
      senderName: senderName || 'User',
      receiverId,
      text,
      createdAt: new Date().toISOString()
    };

    conv.messages.push(newMsg);
    conv.lastMessageText = text;
    conv.lastMessageAt = new Date().toISOString();

    // Trigger instant mock responsive assistant message if chatting with simulated participants
    let triggeredReply = false;
    let replyMsg: ChatMessage | null = null;

    if (receiverId.startsWith('owner-') || receiverId.startsWith('agent-') || receiverId === 'ai-broker') {
      triggeredReply = true;
      const autoText = receiverId === 'ai-broker' 
        ? `Namaste! I am your ApnaGhar AI Smart Broker. Let me look up that listing for you. Standard inquiry has been shared. Would you like me to schedule a visit?`
        : `Thank you for your message regarding the listing. I have received your request and will contact you directly via call or WhatsApp. Let's schedule a physical tour soon!`;
      
      replyMsg = {
        id: `msg-reply-${Date.now()}`,
        conversationId: conv.id,
        senderId: receiverId,
        senderName: conv.participantNames[receiverId] || 'Agent Support',
        receiverId: senderId,
        text: autoText,
        createdAt: new Date().toISOString()
      };
      conv.messages.push(replyMsg);
      conv.lastMessageText = autoText;
      conv.lastMessageAt = new Date().toISOString();
    }

    saveDB();
    res.status(201).json({
      message: newMsg,
      reply: replyMsg,
      conversation: conv
    });
  });

  // 5. Admin Utilities
  app.get('/api/admin/stats', (req, res) => {
    const totalUsersCount = dbData.users ? dbData.users.length : 124; // Simulated registry
    const totalBookingsCount = dbData.bookings.length;
    const viewsTotal = dbData.properties.reduce((acc, p) => acc + (p.views || 0), 0);
    const leadsTotal = dbData.properties.reduce((acc, p) => acc + (p.leadsCount || 0), 0);

    res.json({
      totalProperties: dbData.properties.length,
      totalBookings: totalBookingsCount,
      totalUsers: totalUsersCount,
      totalViews: viewsTotal,
      totalLeads: leadsTotal,
      pendingApproval: dbData.properties.filter(p => p.status === 'PENDING').length,
      approvedCount: dbData.properties.filter(p => p.status === 'APPROVED').length,
    });
  });

  // 5a. Admin Bulk Email Alerts & Promotion Broadcasts
  app.post('/api/admin/send-bulk-promo', (req, res) => {
    const { subject, body, targetRole } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and Body text are required to trigger bulk broadcasts.' });
    }

    // Filter opted-in recipients from dbData.users
    let recipients = dbData.users.filter(u => u.optedIn !== false);
    if (targetRole && targetRole !== 'ALL') {
      recipients = recipients.filter(u => u.role === targetRole);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No opted-in users found matching the filter criteria.' });
    }

    // Unshift simulated email notifications so they display dynamically in client alert center
    recipients.forEach(usr => {
      dbData.notifications.unshift({
        id: `bulk-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        email: usr.email,
        subject: subject,
        body: `Dear ${usr.name || 'ApnaGhar Member'},\n\n${body}\n\nWarm regards,\nApnaGhar Realty Compliance & Promos Office.`,
        createdAt: new Date().toISOString()
      });
    });

    saveDB();
    res.json({
      success: true,
      recipientsCount: recipients.length,
      emailsSent: recipients.map(r => r.email)
    });
  });

  // 5b. Admin Sitemap Regeneration Trigger
  app.post('/api/admin/sitemap/regenerate', (req, res) => {
    generateSitemapXML();
    const filepath = path.join(process.cwd(), 'sitemap.xml');
    const stats = fs.statSync(filepath);
    res.json({
      success: true,
      message: 'XML Sitemap has been regenerated and saved successfully to the project root directory.',
      filepath: filepath,
      size: stats.size,
      updatedAt: stats.mtime
    });
  });

  // 2b. Neighborhood Tips & Vibes API
  app.get('/api/properties/:id/community-vibes', (req, res) => {
    if (!dbData.communityVibes) {
      dbData.communityVibes = [];
    }
    const vibes = dbData.communityVibes.filter(v => v.propertyId === req.params.id);
    res.json(vibes);
  });

  app.post('/api/properties/:id/community-vibes', (req, res) => {
    const { reviewerName, category, comment, rating } = req.body;
    if (!reviewerName || !category || !comment || !rating) {
      return res.status(400).json({ error: 'Name, Category, Rating and Tips content are required.' });
    }

    const newVibe = {
      id: `vibe-${Date.now()}`,
      propertyId: req.params.id,
      reviewerName,
      category,
      comment,
      rating: Number(rating),
      createdAt: new Date().toISOString()
    };

    if (!dbData.communityVibes) {
      dbData.communityVibes = [];
    }
    dbData.communityVibes.unshift(newVibe);
    saveDB();
    res.status(201).json(newVibe);
  });

  // 6b. Tenant Screening API
  app.get('/api/tenant-screenings', (req, res) => {
    if (!dbData.tenantScreenings) {
      dbData.tenantScreenings = [];
    }
    // Filter out if owner filters are requested, for ease return all or filter by ownerId
    const { ownerId } = req.query;
    let list = dbData.tenantScreenings;
    if (ownerId) {
      list = list.filter(s => s.ownerId === ownerId);
    }
    res.json(list);
  });

  app.post('/api/tenant-screenings/request', (req, res) => {
    const { applicantName, applicantEmail, propertyId, propertyTitle, ownerId } = req.body;
    if (!applicantName || !applicantEmail || !propertyId || !propertyTitle) {
      return res.status(400).json({ error: 'Applicant Name, Email, Property Details are required.' });
    }

    const ratings = [780, 690, 720, 610, 810, 580];
    const crims = ['No criminal records found (Nationwide checking clear)', 'No criminal records found (Checked 34 state registers)', 'Minor traffic citation (dismissed)', 'No criminal records found'];
    const evicts = ['No prior eviction records registered', 'No prior eviction records registered', '1 prior eviction record from 2022 (Resolved)', 'No prior eviction records registered'];
    const jobs = ['Verified - Lead Arch at Infosys', 'Verified - Senior Manager at PwC', 'Self-employed Business owner', 'Verified - Analyst at ICICI bank', 'Unverified - Self-reported gig worker'];
    const incomeRatios = [3.8, 4.2, 2.9, 5.1, 1.8];
    const outcomes = ['Highly Recommended', 'Recommended - Security Deposit 2 Months', 'Recommended with Co-signer', 'Highly Recommended', 'High Risk - Low Income Ratio'];

    const randomIndex = Math.floor(Math.random() * outcomes.length);

    const newScreening = {
      id: `screen-${Date.now()}`,
      applicantName,
      applicantEmail,
      propertyId,
      propertyTitle,
      ownerId: ownerId || 'owner-demo',
      status: 'COMPLETED' as const,
      creditScore: ratings[randomIndex % ratings.length],
      criminalRecord: crims[randomIndex % crims.length],
      evictionHistory: evicts[randomIndex % evicts.length],
      employmentStatus: jobs[randomIndex % jobs.length],
      incomeRatio: incomeRatios[randomIndex % incomeRatios.length],
      recommendation: outcomes[randomIndex % outcomes.length],
      createdAt: new Date().toISOString()
    };

    if (!dbData.tenantScreenings) {
      dbData.tenantScreenings = [];
    }
    dbData.tenantScreenings.unshift(newScreening);
    saveDB();
    res.status(201).json(newScreening);
  });

  // 6. User Directory & Role Management API (Admin Access)
  app.get('/api/users', (req, res) => {
    res.json(dbData.users || []);
  });

  app.put('/api/users/:email/role', (req, res) => {
    const { email } = req.params;
    const { role } = req.body;
    
    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    const user = (dbData.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User profile not found in system registry.' });
    }

    user.role = role as UserRole;
    saveDB();

    res.json({ message: `Successfully updated user ${email} to role '${role}'.`, user });
  });

  // Auth / Role Session Synchronization Endpoint
  app.post('/api/auth/sync', (req, res) => {
    const { name, email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const normalizedEmail = email.toLowerCase();
    if (!dbData.users) dbData.users = [];

    let user = dbData.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      const finalRole = normalizedEmail === 'aniwas111@gmail.com' ? UserRole.ADMIN : (role || UserRole.BUYER);
      user = {
        id: normalizedEmail,
        name: name || email.split('@')[0],
        email: normalizedEmail,
        role: finalRole
      };
      dbData.users.push(user);
      saveDB();
    } else {
      if (name && !user.name) {
        user.name = name;
        saveDB();
      }
    }

    res.json(user);
  });

  // --- AI GEMINI ENDPOINTS ---

  // AI Endpoint: Property Description Generator
  app.post('/api/ai/describe', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ 
        error: 'AI Services Unavailable', 
        message: 'The Gemini API key is currently not configured under AI Studio Secrets. To enable automatic property descriptions, please click on Settings > Secrets and input GEMINI_API_KEY.' 
      });
    }

    const { category, type, price, area, details, location, amenities } = req.body;
    const prompt = `Write a polished, highly description marketing text for a premium Indian property listing platform named "ApnaGhar".
    Property specifications:
    - Main type: ${type} (${category})
    - Ask pricing: ₹${price.toLocaleString('en-IN')}
    - Floor area: ${area} Sq. Ft.
    - Setup: Bedrooms: ${details?.bedrooms || 'N/A'}, Bathrooms: ${details?.bathrooms || 'N/A'}, Furnishing: ${details?.furnishingStatus || 'Unfurnished'}
    - Sector Location: ${location?.area}, ${location?.city}, ${location?.state}
    - Key facilities: ${Object.keys(amenities || {}).filter(k => amenities[k]).join(', ') || 'Standard basic facilities'}

    Guidelines:
    1. Make it sound appealing, professional, encouraging buyers or renters to connect instantly.
    2. Suggest specific lifestyle highlights suitable for its Indian metropolitan city context.
    3. Keep it within 3-4 concise, impactful lines. Done in rich elegant marketing prose.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      res.json({ description: response.text?.trim() });
    } catch (err: any) {
      console.error('Error in describe API:', err);
      res.status(500).json({ error: 'Failed to generate property description', details: err.message });
    }
  });

  // AI Endpoint: Intelligent Property Recommendation Engine
  app.post('/api/ai/recommend', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ 
        error: 'AI Services Unavailable', 
        message: 'The Gemini API key is currently not configured under AI Studio Secrets. Please inject GEMINI_API_KEY to test the live intelligent matchmaker.' 
      });
    }

    const { userBudget, preferredCity, preferredCategory, bedrooms, customInput } = req.body;

    // Serialize database properties to feed as context for zero-shot ranking
    const dbSummary = dbData.properties.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      purpose: p.purpose,
      city: p.location.city,
      area: p.location.area,
      category: p.category,
      type: p.type,
      beds: p.details.bedrooms,
      amenities: Object.keys(p.amenities).filter(k => (p.amenities as any)[k])
    }));

    const prompt = `You are ApnaGhar AI Smart Broker, an elite, friendly real estate recommendation engine.
    Analyze the buyer's criteria and recommend up to 3 properties from our available inventory listing below:
    
    Buyer Requirements:
    - Preferred City: ${preferredCity || 'Any'}
    - Maximum Budget Limit: ₹${Number(userBudget || 1000000000).toLocaleString('en-IN')}
    - Type of property: ${preferredCategory || 'Any'}
    - Bedrooms: ${bedrooms || 'Any'}
    - Personal search request context: "${customInput || 'Help me find the best fits!'}"

    Available Property Database Content:
    ${JSON.stringify(dbSummary, null, 2)}

    Output Format (Render in absolute JSON format only, conform to this precise structure. Ensure valid nesting):
    {
      "explanation": "A friendly 3-sentence summary message greeting the customer, advising on the Indian real estate climate regarding their request and explaining how you selected these properties.",
      "recommendations": [
        {
          "id": "matching property ID from database",
          "reason": "Specific 2-line explanation detailing why this listing matches their budget, location, and key desired amenities perfectly."
        }
      ]
    }
    Ensure valid, clean JSON without any enclosing markdown block backticks other than raw text.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in recommend API:', err);
      res.status(500).json({ error: 'Failed to generate property recommendations', details: err.message });
    }
  });

  // Static Assets and Vite Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for all other paths to support React Single Page App routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApnaGhar Full-Stack server is actively listening on http://localhost:${PORT}`);
  });
}

startServer();
