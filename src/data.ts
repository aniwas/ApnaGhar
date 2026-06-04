import { Property, SubscriptionPlan } from './types';

export const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    title: 'The Sky Garden Penthouse',
    description: 'Breathtaking 4 BHK luxury penthouse at Worli Seaface with a private terrace pool, Italian marble flooring, high ceilings, custom walk-in closets, and panoramic Arabian Sea views. Fully integrated with automated home technology. Includes state-of-the-art kitchen equipment and high-end air purification system.',
    category: 'RESIDENTIAL',
    type: 'Penthouse',
    purpose: 'SELL',
    price: 125000000, // 12.5 Cr
    maintenanceCharges: 15000,
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      area: 'Worli',
      address: 'Worli Seaface Road, Near Mahalaxmi Temple',
      postalCode: '400018',
      latitude: 18.9986,
      longitude: 72.8152
    },
    details: {
      bedrooms: 4,
      bathrooms: 5,
      balconies: 3,
      floors: 2,
      area: 4800,
      furnishingStatus: 'FULLY_FURNISHED'
    },
    amenities: {
      parking: true,
      lift: true,
      swimmingPool: true,
      gym: true,
      garden: true,
      security24x7: true,
      cctv: true,
      powerBackup: true,
      internet: true
    },
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    virtualTourUrl: 'https://my.matterport.com/show/?m=example',
    floorPlanUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
    ownerId: 'owner-1',
    ownerName: 'Vikram Aditya Singhal',
    ownerType: 'OWNER',
    status: 'APPROVED',
    views: 452,
    leadsCount: 38,
    featured: true,
    createdAt: '2026-05-15T12:00:00Z',
    updatedAt: '2026-06-01T09:30:00Z'
  },
  {
    id: 'prop-2',
    title: 'Elegance Boulevard Flat',
    description: 'Modern and sun-drenched 3 BHK apartment situated in Noida Sector 62. Proximity to major IT Parks and Metro Station is ideal for professionals. Offers a spacious kitchen, private balcony overlooking the internal central park, secure designated basement parking, and complete split unit ACs.',
    category: 'RESIDENTIAL',
    type: 'Apartment',
    purpose: 'RENT',
    price: 45000, // 45k / month
    securityDeposit: 135000,
    maintenanceCharges: 3500,
    location: {
      country: 'India',
      state: 'Uttar Pradesh',
      city: 'Noida',
      area: 'Sector 62',
      address: 'Tower C, Elegance Heights, Sector 62',
      postalCode: '201301',
      latitude: 28.6213,
      longitude: 77.3622
    },
    details: {
      bedrooms: 3,
      bathrooms: 3,
      balconies: 2,
      floors: 1,
      area: 1650,
      furnishingStatus: 'SEMI_FURNISHED'
    },
    amenities: {
      parking: true,
      lift: true,
      swimmingPool: true,
      gym: true,
      garden: true,
      security24x7: true,
      cctv: true,
      powerBackup: true,
      internet: true
    },
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800'
    ],
    ownerId: 'owner-2',
    ownerName: 'Nisha Sharma',
    ownerType: 'OWNER',
    status: 'APPROVED',
    views: 289,
    leadsCount: 14,
    featured: false,
    createdAt: '2026-05-20T14:30:00Z',
    updatedAt: '2026-05-20T14:30:00Z'
  },
  {
    id: 'prop-3',
    title: 'The Meadows Luxury Villa',
    description: 'Ultra-luxurious 4 BHK independent villa in Bangalore Whitefield, located in a pristine gated community with 24/7 security. Features a private landscaped backyard, European open-plan modern modular kitchen, separate servant quarters, home theatre room, and solar energy installations.',
    category: 'RESIDENTIAL',
    type: 'Villa',
    purpose: 'SELL',
    price: 52000000, // 5.2 Cr
    maintenanceCharges: 8000,
    location: {
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      area: 'Whitefield',
      address: 'Lane 4, The Meadows Enclave, Whitefield',
      postalCode: '560066',
      latitude: 12.9698,
      longitude: 77.7499
    },
    details: {
      bedrooms: 4,
      bathrooms: 4,
      balconies: 2,
      floors: 2,
      area: 3800,
      furnishingStatus: 'FULLY_FURNISHED'
    },
    amenities: {
      parking: true,
      lift: false,
      swimmingPool: true,
      gym: true,
      garden: true,
      security24x7: true,
      cctv: true,
      powerBackup: true,
      internet: true
    },
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1613977257592-4871e5fbe7c5?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    ownerId: 'agent-1',
    ownerName: 'Rajesh Malhotra (Malhotra Estates)',
    ownerType: 'AGENT',
    status: 'APPROVED',
    views: 612,
    leadsCount: 54,
    featured: true,
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-06-02T11:15:00Z'
  },
  {
    id: 'prop-4',
    title: 'CyberHub Premier Corporate Suite',
    description: 'Premium plug-and-play corporate office space in DLF Cyber City, Gurgaon. Located on a high floor of a grade-A building with continuous high-speed elevators, conference room setup, wet pantry, and reception desks. It can easily accommodate 45+ workstations with an elegant glass layout.',
    category: 'COMMERCIAL',
    type: 'Office',
    purpose: 'LEASE',
    price: 350000, // 3.5 Lakhs / month
    securityDeposit: 1050000,
    maintenanceCharges: 25000,
    location: {
      country: 'India',
      state: 'Haryana',
      city: 'Gurgaon',
      area: 'DLF Cyber City',
      address: 'Tower A, CyberHub Tech Space, Phase 3',
      postalCode: '122002',
      latitude: 28.4951,
      longitude: 77.0894
    },
    details: {
      bedrooms: 0,
      bathrooms: 3,
      balconies: 0,
      floors: 1,
      area: 3200,
      furnishingStatus: 'FULLY_FURNISHED'
    },
    amenities: {
      parking: true,
      lift: true,
      swimmingPool: false,
      gym: false,
      garden: false,
      security24x7: true,
      cctv: true,
      powerBackup: true,
      internet: true
    },
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800'
    ],
    ownerId: 'agent-1',
    ownerName: 'Rajesh Malhotra (Malhotra Estates)',
    ownerType: 'AGENT',
    status: 'APPROVED',
    views: 180,
    leadsCount: 12,
    featured: true,
    createdAt: '2026-05-25T16:00:00Z',
    updatedAt: '2026-05-26T09:00:00Z'
  },
  {
    id: 'prop-5',
    title: 'High-Street Retail Showroom',
    description: 'Double height high-street commercial retail space on FC Road, Pune. Features maximum street-facing exposure, enormous display windows, standard storage cellar, heavy foot traffic, and immediate parking. Perfect for fashion, luxury goods, or fancy cafes.',
    category: 'COMMERCIAL',
    type: 'Shop',
    purpose: 'RENT',
    price: 180000,
    securityDeposit: 540000,
    maintenanceCharges: 8500,
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Shivajinagar',
      address: 'FC Road, Near Deccan Gymkhana',
      postalCode: '411004',
      latitude: 18.5246,
      longitude: 73.8412
    },
    details: {
      area: 1450,
      furnishingStatus: 'UNFURNISHED'
    },
    amenities: {
      parking: true,
      lift: false,
      swimmingPool: false,
      gym: false,
      garden: false,
      security24x7: true,
      cctv: true,
      powerBackup: true,
      internet: false
    },
    images: [
      'https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerId: 'owner-3',
    ownerName: 'Devendra Kulkarni',
    ownerType: 'OWNER',
    status: 'APPROVED',
    views: 122,
    leadsCount: 9,
    featured: false,
    createdAt: '2026-05-28T09:15:00Z',
    updatedAt: '2026-06-03T05:00:00Z'
  },
  {
    id: 'prop-6',
    title: 'Scenic Green Valley Plot',
    description: 'Fully cleared premium level residential plot ready for construction, nestled in Devanahalli, Bangalore, near the International Airport. Fully approved by local municipal bodies, with active clean water pipelines, electric layout connections, concrete approach roads, and scenic boundary fencing.',
    category: 'LAND',
    type: 'Residential Plot',
    purpose: 'SELL',
    price: 7800000, // 78 Lakhs
    location: {
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      area: 'Devanahalli',
      address: 'Phase III, Valley View Layout, Devanahalli',
      postalCode: '562110',
      latitude: 13.2483,
      longitude: 77.7135
    },
    details: {
      area: 3200
    },
    amenities: {
      parking: false,
      lift: false,
      swimmingPool: false,
      gym: false,
      garden: true,
      security24x7: true,
      cctv: false,
      powerBackup: false,
      internet: false
    },
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800'
    ],
    ownerId: 'agent-2',
    ownerName: 'Ananth Gowda (Gowda Realties)',
    ownerType: 'AGENT',
    status: 'PENDING',
    views: 340,
    leadsCount: 22,
    featured: false,
    createdAt: '2026-05-18T11:00:00Z',
    updatedAt: '2026-05-19T08:00:00Z'
  },
  {
    id: 'prop-7',
    title: 'Modern Logistic Warehouse Space',
    description: 'Enormous state-of-the-art heavy commercial warehouse with high clear ceilings, heavy-duty epoxy industrial flooring, multi-dock shutter loading access, fully functional office cabins, independent electricity feeder, robust fire protection design, and immediate heavy transport access.',
    category: 'COMMERCIAL',
    type: 'Warehouse',
    purpose: 'LEASE',
    price: 150000,
    securityDeposit: 600000,
    maintenanceCharges: 12000,
    location: {
      country: 'India',
      state: 'Gujarat',
      city: 'Ahmedabad',
      area: 'Sanand',
      address: 'Plot 4A, Sanand GIDC Phase II',
      postalCode: '382110',
      latitude: 23.0116,
      longitude: 72.3922
    },
    details: {
      area: 12000,
      floors: 1
    },
    amenities: {
      parking: true,
      lift: false,
      swimmingPool: false,
      gym: false,
      garden: false,
      security24x7: true,
      cctv: true,
      powerBackup: true,
      internet: true
    },
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200'
    ],
    ownerId: 'agent-1',
    ownerName: 'Rajesh Malhotra (Malhotra Estates)',
    ownerType: 'AGENT',
    status: 'PENDING',
    views: 92,
    leadsCount: 5,
    featured: false,
    createdAt: '2026-05-05T08:45:00Z',
    updatedAt: '2026-05-05T08:45:00Z'
  }
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free Plan',
    price: 0,
    billing: 'monthly',
    listingsLimit: 2,
    features: [
      'Up to 2 property listings',
      'Basic property details & photos',
      'Direct visitor inquiry via WhatsApp & Email',
      'Standard search indexing',
      '7 days listing survival duration'
    ]
  },
  {
    id: 'plan-premium',
    name: 'Premium Growth',
    price: 4999, // ₹4,999 / month
    billing: 'monthly',
    listingsLimit: 20,
    features: [
      'Up to 20 active listings',
      'Featured badge on 3 listings',
      'Complete CRM & Lead Analytics Dashboard',
      'Premium customer priority support',
      'Virtual video tours & Floor plans allowed',
      'Automatic SEO & Social sharing integration'
    ]
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Executive',
    price: 14999, // ₹14,999 / month
    billing: 'monthly',
    listingsLimit: 999999, // Unlimited
    features: [
      'Unlimited property listings',
      'Unrestricted Featured properties & Banner promotions',
      'Unlimited Leads and Direct Chat CRM',
      'Dedicated personal account manager',
      'Full API bulk upload capabilities',
      'Verified Agent certificate badge'
    ]
  }
];

export const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", 
  "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", 
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", 
  "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", 
  "Navi Mumbai", "Prayagraj", "Howrah", "Ranchi", "Jabalpur", "Gwalior", "Coimbatore", "Vijayawada", 
  "Jodhpur", "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli-Dharwad", "Noida", 
  "Gurgaon", "Bhubaneswar", "Jammu", "Dehradun", "Kochi", "Udaipur", "Panaji", "Shimla", "Mangalore",
  "Mysore", "Trivandrum", "Ambala", "Jalandhar", "Pondicherry", "Salem", "Coorg", "Rishikesh", "Haridwar"
].sort();

export interface GeoLocationItem {
  city: string;
  district: string;
  state: string;
}

export const INDIAN_GEO_DATABASE: GeoLocationItem[] = [
  { city: "Mumbai", district: "Mumbai City / Suburban", state: "Maharashtra" },
  { city: "Delhi", district: "New Delhi", state: "Delhi" },
  { city: "Bangalore", district: "Bengaluru Urban", state: "Karnataka" },
  { city: "Hyderabad", district: "Hyderabad", state: "Telangana" },
  { city: "Ahmedabad", district: "Ahmedabad", state: "Gujarat" },
  { city: "Chennai", district: "Chennai", state: "Tamil Nadu" },
  { city: "Kolkata", district: "Kolkata", state: "West Bengal" },
  { city: "Surat", district: "Surat", state: "Gujarat" },
  { city: "Pune", district: "Pune", state: "Maharashtra" },
  { city: "Jaipur", district: "Jaipur", state: "Rajasthan" },
  { city: "Lucknow", district: "Lucknow", state: "Uttar Pradesh" },
  { city: "Kanpur", district: "Kanpur Nagar", state: "Uttar Pradesh" },
  { city: "Nagpur", district: "Nagpur", state: "Maharashtra" },
  { city: "Indore", district: "Indore", state: "Madhya Pradesh" },
  { city: "Thane", district: "Thane", state: "Maharashtra" },
  { city: "Bhopal", district: "Bhopal", state: "Madhya Pradesh" },
  { city: "Visakhapatnam", district: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Pimpri-Chinchwad", district: "Pune", state: "Maharashtra" },
  { city: "Patna", district: "Patna", state: "Bihar" },
  { city: "Vadodara", district: "Vadodara", state: "Gujarat" },
  { city: "Ghaziabad", district: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Ludhiana", district: "Ludhiana", state: "Punjab" },
  { city: "Agra", district: "Agra", state: "Uttar Pradesh" },
  { city: "Nashik", district: "Nashik", state: "Maharashtra" },
  { city: "Faridabad", district: "Faridabad", state: "Haryana" },
  { city: "Meerut", district: "Meerut", state: "Uttar Pradesh" },
  { city: "Rajkot", district: "Rajkot", state: "Gujarat" },
  { city: "Kalyan-Dombivli", district: "Thane", state: "Maharashtra" },
  { city: "Vasai-Virar", district: "Palghar", state: "Maharashtra" },
  { city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh" },
  { city: "Srinagar", district: "Srinagar", state: "Jammu and Kashmir" },
  { city: "Aurangabad", district: "Aurangabad", state: "Maharashtra" },
  { city: "Dhanbad", district: "Dhanbad", state: "Jharkhand" },
  { city: "Amritsar", district: "Amritsar", state: "Punjab" },
  { city: "Navi Mumbai", district: "Thane", state: "Maharashtra" },
  { city: "Prayagraj", district: "Prayagraj", state: "Uttar Pradesh" },
  { city: "Howrah", district: "Howrah", state: "West Bengal" },
  { city: "Ranchi", district: "Ranchi", state: "Jharkhand" },
  { city: "Jabalpur", district: "Jabalpur", state: "Madhya Pradesh" },
  { city: "Gwalior", district: "Gwalior", state: "Madhya Pradesh" },
  { city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu" },
  { city: "Vijayawada", district: "Krishna", state: "Andhra Pradesh" },
  { city: "Jodhpur", district: "Jodhpur", state: "Rajasthan" },
  { city: "Madurai", district: "Madurai", state: "Tamil Nadu" },
  { city: "Raipur", district: "Raipur", state: "Chhattisgarh" },
  { city: "Kota", district: "Kota", state: "Rajasthan" },
  { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh" },
  { city: "Guwahati", district: "Kamrup Metropolitan", state: "Assam" },
  { city: "Solapur", district: "Solapur", state: "Maharashtra" },
  { city: "Hubli-Dharwad", district: "Dharwad", state: "Karnataka" },
  { city: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh" },
  { city: "Gurgaon", district: "Gurugram", state: "Haryana" },
  { city: "Bhubaneswar", district: "Khordha", state: "Odisha" },
  { city: "Jammu", district: "Jammu", state: "Jammu and Kashmir" },
  { city: "Dehradun", district: "Dehradun", state: "Uttarakhand" },
  { city: "Kochi", district: "Ernakulam", state: "Kerala" },
  { city: "Udaipur", district: "Udaipur", state: "Rajasthan" },
  { city: "Panaji", district: "North Goa", state: "Goa" },
  { city: "Shimla", district: "Shimla", state: "Himachal Pradesh" },
  { city: "Mangalore", district: "Dakshina Kannada", state: "Karnataka" },
  { city: "Mysore", district: "Mysore", state: "Karnataka" },
  { city: "Trivandrum", district: "Thiruvananthapuram", state: "Kerala" },
  { city: "Ambala", district: "Ambala", state: "Haryana" },
  { city: "Jalandhar", district: "Jalandhar", state: "Punjab" },
  { city: "Pondicherry", district: "Puducherry", state: "Puducherry" },
  { city: "Salem", district: "Salem", state: "Tamil Nadu" },
  { city: "Coorg", district: "Kodagu", state: "Karnataka" },
  { city: "Rishikesh", district: "Dehradun", state: "Uttarakhand" },
  { city: "Haridwar", district: "Haridwar", state: "Uttarakhand" }
].sort((a,b) => a.city.localeCompare(b.city));


