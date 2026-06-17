import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../services/safeStorage';

export type Locale = 'en' | 'hi' | 'mr';

interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

const DICTIONARY: TranslationDictionary = {
  // Navbar
  brand_subtitle: {
    en: 'YOUR TRUSTED HOMELAND COMPANION',
    hi: 'आपका विश्वसनीय गृह साथी',
    mr: 'तुमचा विश्वासू गृह सोबती'
  },
  ask_ai_broker: {
    en: 'Ask AI Broker',
    hi: 'एआई ब्रोकर से पूछें',
    mr: 'एआय ब्रोकरला विचारा'
  },
  register_account: {
    en: 'Register Account',
    hi: 'खाता पंजीकृत करें',
    mr: 'खाते नोंदणी करा'
  },
  logout: {
    en: 'Logout',
    hi: 'लॉगआउट',
    mr: 'लॉगआउट'
  },
  namaste: {
    en: 'Namaste',
    hi: 'नमस्ते',
    mr: 'नमस्कार'
  },
  switch_workspace: {
    en: 'Switch Workspace Persona',
    hi: 'कार्यक्षेत्र भूमिका बदलें',
    mr: 'कार्यक्षेत्र भूमिका बदला'
  },
  explore_perspectives: {
    en: 'Explore ApnaGhar from different perspectives',
    hi: 'विभिन्न दृष्टिकोणों से अपनाघर का अन्वेषण करें',
    mr: 'वेगवेगळ्या दृष्टिकोनातून अपनाघर एक्सप्लोर करा'
  },
  roles_managed_admin: {
    en: 'Roles are managed & assigned strictly by Admins.',
    hi: 'भूमिकाएं केवल एडमिन द्वारा प्रबंधित और आवंटित की जाती हैं।',
    mr: 'भूमिका केवळ ॲडमिनद्वारे व्यवस्थापित आणि नियुक्त केल्या जातात.'
  },

  // Main UI Search and Filters
  search_placeholder: {
    en: 'e.g. Sea view, Villa...',
    hi: 'जैसे: समुद्र दर्शन, विला...',
    mr: 'उदा. समुद्र दर्शन, व्हिला...'
  },
  search_keyword: {
    en: 'Search Keyword',
    hi: 'खोज शब्द',
    mr: 'शोध कीवर्ड'
  },
  property_category: {
    en: 'Category',
    hi: 'श्रेणी',
    mr: 'वर्ग'
  },
  property_purpose: {
    en: 'Purpose',
    hi: 'उद्देश्य',
    mr: 'उद्देश'
  },
  property_beds: {
    en: 'Beds & Layout',
    hi: 'बेडरूम और लेआउट',
    mr: 'बेडरूम आणि लेआउट'
  },
  max_price_limit: {
    en: 'Max Price (INR)',
    hi: 'अधिकतम मूल्य (INR)',
    mr: 'कमाल किंमत (INR)'
  },
  selected_city: {
    en: 'Select City',
    hi: 'शहर चुनें',
    mr: 'शहर निवडा'
  },
  all_cities: {
    en: 'All Cities',
    hi: 'सभी शहर',
    mr: 'सर्व शहरे'
  },
  any_beds: {
    en: 'Any Beds',
    hi: 'कोई भी बेडरूम',
    mr: 'कोणतेही बेडरूम'
  },
  any_purpose: {
    en: 'Any Purpose',
    hi: 'कोई भी उद्देश्य',
    mr: 'कोणताही उद्देश'
  },
  any_category: {
    en: 'Any Category',
    hi: 'कोई भी श्रेणी',
    mr: 'कोणतीही श्रेणी'
  },

  // Buttons & Badges
  asking_price: {
    en: 'Asking Price',
    hi: 'पूछी गई कीमत',
    mr: 'विचारलेली किंमत'
  },
  per_month_rent: {
    en: 'Per Month Rent',
    hi: 'प्रति माह किराया',
    mr: 'दरमहा भाडे'
  },
  view_details: {
    en: 'View Details',
    hi: 'विवरण देखें',
    mr: 'तपशील पहा'
  },
  save_visit: {
    en: 'Schedule Tour',
    hi: 'दौरा तय करें',
    mr: 'भेट नियोजित करा'
  },
  site_tour_booked: {
    en: 'Tour Requested Successfully',
    hi: 'दौरा सफलतापूर्वक अनुरोधित हुआ',
    mr: 'भेट यशस्वीरित्या विनंती केली'
  },

  // Live Listings & Interactive states
  featured_listing: {
    en: 'Featured',
    hi: 'विशेष रुप से प्रदर्शित',
    mr: 'वैशिष्ट्यीकृत'
  },
  price_history: {
    en: 'Price History & Local Market Index',
    hi: 'मूल्य इतिहास और स्थानीय बाजार सूचकांक',
    mr: 'किंमत इतिहास आणि स्थानिक बाजार निर्देशांक'
  },
  virtual_tour_heading: {
    en: 'Interactive 360° Interior tour',
    hi: 'इंटरैक्टिव 360° आंतरिक दौरा',
    mr: 'परस्परसंवादी 360° अंतर्गत भेट'
  },
  immersive_view: {
    en: '360° IMMERSIVE VIEW',
    hi: '360° इमर्सिव विहंगम दृश्य',
    mr: '360° इमर्सिव्ह व्ह्यू'
  },
  share_property: {
    en: 'Share Property',
    hi: 'संपत्ति साझा करें',
    mr: 'मालमत्ता शेअर करा'
  },
  social_share_desc: {
    en: 'Share this elegant property listed on ApnaGhar with family and friends.',
    hi: 'अपनाघर पर सूचीबद्ध इस सुंदर संपत्ति को परिवार और दोस्तों के साथ साझा करें।',
    mr: 'अपनाघर वर सूचीबद्ध केलेली ही सुंदर मालमत्ता कुटुंब आणि मित्रांसह शेअर करा.'
  },
  copy_link: {
    en: 'Copy Link',
    hi: 'लिंक कॉपी करें',
    mr: 'लिंक कॉपी करा'
  },
  link_copied: {
    en: 'Link Copied!',
    hi: 'लिंक कॉपी हो गई!',
    mr: 'लिंक कॉपी झाली!'
  },
  fullscreen_mode: {
    en: 'Immersive Fullscreen Gallery',
    hi: 'इमर्सिव फुलस्क्रीन गैलरी',
    mr: 'इमर्सिव्ह फुलस्क्रीन गॅलरी'
  },
  browser_push_alerts: {
    en: 'Browser Push Alerts',
    hi: 'ब्राउज़र पुश अलर्ट',
    mr: 'ब्राउझर पुश अलर्ट'
  },
  browser_push_desc: {
    en: 'Receive active browser reminders directly when agents approve tours.',
    hi: 'एजेंट द्वारा दौरा स्वीकृत किए जाने पर सीधे ब्राउज़र सूचनाएं प्राप्त करें।',
    mr: 'एजेंटने भेटीला मंजुरी दिल्यावर थेट ब्राउझर सूचना मिळवा.'
  },
  enable_push: {
    en: 'Enable Push Notifications',
    hi: 'पुश सूचनाएं सक्षम करें',
    mr: 'पुश सूचना सक्षम करा'
  },
  total_listings: {
    en: 'ApnaGhar Verified Premium Properties Found',
    hi: 'अपनाघर सत्यापित प्रीमियम संपत्तियां मिलीं',
    mr: 'अपनाघर प्रमाणित प्रीमियम मालमत्ता सापडल्या'
  },
  no_matching_properties: {
    en: 'No properties matching your criteria found.',
    hi: 'आपके मापदंडों से मेल खाती कोई संपत्ति नहीं मिली।',
    mr: 'तुमच्या निकषांशी जुळणारी कोणतीही मालमत्ता आढळली नाही.'
  }
};

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = safeStorage.getItem('apnaghar_locale');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') {
      return saved;
    }
    return 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    safeStorage.setItem('apnaghar_locale', newLocale);
  };

  const t = (key: string): string => {
    const entry = DICTIONARY[key];
    if (entry) {
      return entry[locale] || entry['en'];
    }
    return key; // fall back to standard key text if not defined in dict
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
