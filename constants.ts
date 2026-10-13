import { Product } from './types';
import { ASSETS } from './assets/images';

export const CURRENCY_SYMBOL = '৳';

const getTextColor = (hex: string) => {
  const lightColors = ['F7B5CD', 'FCD116', 'FFFFFF', 'E5C468', '6CABDD', '75AADB'];
  return lightColors.includes(hex) ? '000000' : 'FFFFFF';
};

const createGallery = (mainImage: string, team: string, color: string, alternatePhoto?: string) => {
  const textCol = getTextColor(color);
  return [
    mainImage,
    alternatePhoto || `https://placehold.co/800x1000/${color}/${textCol}?text=${encodeURIComponent(team)}+Back+View&font=oswald`,
    `https://placehold.co/800x1000/${color}/${textCol}?text=${encodeURIComponent(team)}+Graphic+Detail&font=oswald`,
    `https://placehold.co/800x1000/${color}/${textCol}?text=${encodeURIComponent(team)}+Lifestyle&font=oswald`
  ];
};

export interface ProductMicroSpec {
  editionBadge: string;
  badgeVariant: 'crimson' | 'gold' | 'charcoal-gold' | 'charcoal-tertiary';
  specLeft: string;
  specRight: string;
  specRightTone?: 'muted' | 'tertiary' | 'secondary';
  priceSubtext?: string;
  priceSubtextTone?: 'muted' | 'secondary';
  outOfStockSizes?: string[];
  displayClub?: string;
  displaySeason?: string;
}

export const PRODUCT_SPECS: Record<string, ProductMicroSpec> = {
  '1': {
    editionBadge: 'PLAYER ADV',
    badgeVariant: 'crimson',
    specLeft: 'DRI-FIT ADV COOLING',
    specRight: '132G MATCH CUT',
    outOfStockSizes: ['XXL'],
    displayClub: 'FC BARCELONA',
    displaySeason: '2025/26'
  },
  '2': {
    editionBadge: 'PRO MATCH CUT',
    badgeVariant: 'charcoal-gold',
    specLeft: 'HEAT.RDY PRO',
    specRight: 'SLIM TAILORED',
    priceSubtext: 'Fan/Pro',
    displayClub: 'REAL MADRID',
    displaySeason: '2025/26'
  },
  '3': {
    editionBadge: '3-STAR EDITION',
    badgeVariant: 'gold',
    specLeft: 'GOLD CHEST BADGE',
    specRight: 'MESSI 10 PRINT',
    specRightTone: 'tertiary',
    priceSubtext: 'Includes Badges',
    priceSubtextTone: 'secondary',
    outOfStockSizes: ['XL'],
    displayClub: 'ARGENTINA AFA',
    displaySeason: 'SPECIAL'
  },
  '4': {
    editionBadge: 'ULTRAWEAVE',
    badgeVariant: 'charcoal-tertiary',
    specLeft: 'AERODYNAMIC KNIT',
    specRight: 'CHAMPIONS BADGE',
    priceSubtext: 'Free Shipping',
    displayClub: 'MANCHESTER CITY',
    displaySeason: '2025/26'
  },
  '5': {
    editionBadge: 'HERITAGE WEAVE',
    badgeVariant: 'charcoal-gold',
    specLeft: 'DRI-FIT MESH',
    specRight: 'CBF CREST',
    priceSubtext: 'Fan/Pro',
    displayClub: 'BRAZIL CBF',
    displaySeason: '2025/26'
  },
  '6': {
    editionBadge: 'STADIUM SPEC',
    badgeVariant: 'charcoal-gold',
    specLeft: 'AEROREADY KNIT',
    specRight: 'CANNON CREST',
    outOfStockSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    displayClub: 'ARSENAL FC',
    displaySeason: '2025/26'
  },
  '7': {
    editionBadge: 'PLAYER ADV',
    badgeVariant: 'crimson',
    specLeft: 'DRI-FIT ADV COOLING',
    specRight: 'ANFIELD CUT',
    displayClub: 'LIVERPOOL FC',
    displaySeason: '2025/26'
  },
  '8': {
    editionBadge: 'PRO MATCH CUT',
    badgeVariant: 'charcoal-gold',
    specLeft: 'HEAT.RDY WEAVE',
    specRight: 'BIANCONERI',
    priceSubtext: 'Fan/Pro',
    displayClub: 'JUVENTUS FC',
    displaySeason: '2025/26'
  },
  '9': {
    editionBadge: 'PLAYER ADV',
    badgeVariant: 'crimson',
    specLeft: 'HEAT.RDY PRO',
    specRight: 'MIA SAN MIA',
    outOfStockSizes: ['XXL'],
    displayClub: 'BAYERN MUNICH',
    displaySeason: '2025/26'
  },
  '10': {
    editionBadge: 'MVP VAULT #042',
    badgeVariant: 'gold',
    specLeft: 'HOLOGRAPHIC NFC',
    specRight: 'GOAT 10 SPEC',
    specRightTone: 'tertiary',
    priceSubtext: 'Numbered Batch',
    priceSubtextTone: 'secondary',
    displayClub: 'INTER MIAMI CF',
    displaySeason: 'SPECIAL'
  },
  '11': {
    editionBadge: 'PLAYER ADV',
    badgeVariant: 'charcoal-tertiary',
    specLeft: 'ULTRAWEAVE PRO',
    specRight: 'RONALDO 7 SPEC',
    priceSubtext: 'Pre-Order Allocation',
    displayClub: 'AL NASSR FC',
    displaySeason: '2025/26'
  },
  '12': {
    editionBadge: 'PRO MATCH CUT',
    badgeVariant: 'charcoal-gold',
    specLeft: 'DRI-FIT COOLING',
    specRight: 'SELEÇÃO QUINAS',
    displayClub: 'PORTUGAL FPF',
    displaySeason: '2025/26'
  }
};

export const getProductMicroSpec = (product: Product): ProductMicroSpec => {
  if (PRODUCT_SPECS[product.id]) return PRODUCT_SPECS[product.id];
  if (product.type === 'Special') {
    return {
      editionBadge: 'COMMEMORATIVE',
      badgeVariant: 'gold',
      specLeft: 'ARCHIVE KNIT',
      specRight: 'NFC CERTIFIED',
      specRightTone: 'tertiary',
      priceSubtext: 'Limited Vault',
      priceSubtextTone: 'secondary',
      displayClub: product.team.toUpperCase(),
      displaySeason: 'SPECIAL'
    };
  }
  if (product.isPlayerEdition) {
    return {
      editionBadge: 'PLAYER ADV',
      badgeVariant: 'crimson',
      specLeft: 'DRI-FIT ADV COOLING',
      specRight: '132G MATCH CUT',
      displayClub: product.team.toUpperCase(),
      displaySeason: product.season || '2025/26'
    };
  }
  return {
    editionBadge: 'PRO MATCH CUT',
    badgeVariant: 'charcoal-gold',
    specLeft: 'HEAT.RDY PRO',
    specRight: 'SLIM TAILORED',
    priceSubtext: 'Fan/Pro',
    displayClub: product.team.toUpperCase(),
    displaySeason: product.season || '2025/26'
  };
};

/**
 * Seed catalogue. The live catalogue is served from D1 (/api/products);
 * this list generates migrations/0002_seed.sql and is the offline fallback.
 * Blends studio macro photography (code.html) with editorial lifestyle shots.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Home Player Edition Match Kit',
    price: 2000,
    originalPrice: 2400,
    image: ASSETS.PRODUCTS.BARCELONA_STUDIO,
    category: 'Club',
    team: 'Barcelona',
    league: 'La Liga',
    type: 'Home',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 4.9,
    reviews: 124,
    description:
      'Experience the authentic feel of Camp Nou with the official 2025/26 Player Edition Home Kit. Features Dri-FIT ADV cooling technology, heat-applied silicone crest, and 132g ultralight match chassis.',
    season: '2025/26',
    color: 'A50044',
    gallery: createGallery(ASSETS.PRODUCTS.BARCELONA_STUDIO, 'Barcelona', 'A50044', ASSETS.PRODUCTS.BARCELONA_HOME)
  },
  {
    id: '2',
    name: 'Emirates Match Home Kit',
    price: 1400,
    image: ASSETS.PRODUCTS.REAL_MADRID_STUDIO,
    category: 'Club',
    team: 'Real Madrid',
    league: 'La Liga',
    type: 'Home',
    isPlayerEdition: false,
    status: 'low-stock',
    rating: 4.7,
    reviews: 89,
    description:
      'The elegant 2025/26 home kit for the kings of Europe. Features premium jacquard houndstooth micro-weave, HEAT.RDY ventilation panels, and crisp metallic trim.',
    season: '2025/26',
    color: '111111',
    gallery: createGallery(ASSETS.PRODUCTS.REAL_MADRID_STUDIO, 'Real Madrid', '111111', ASSETS.PRODUCTS.REAL_MADRID_HOME)
  },
  {
    id: '3',
    name: 'Argentina 3-Star Commemorative',
    price: 2200,
    image: ASSETS.PRODUCTS.ARGENTINA_STUDIO,
    category: 'National',
    team: 'Argentina',
    league: 'International',
    type: 'Home',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 5.0,
    reviews: 450,
    description:
      'Wear the World Champions gold badge with pride. Authentic 3-Star AFA jersey with official gold chest patch and breathable match-spec weave.',
    season: '2025/26',
    color: '75AADB',
    gallery: createGallery(ASSETS.PRODUCTS.ARGENTINA_STUDIO, 'Argentina', '75AADB', ASSETS.PRODUCTS.ARGENTINA_HOME)
  },
  {
    id: '4',
    name: 'Man City Pro Home Edition',
    price: 1680,
    image: ASSETS.PRODUCTS.MAN_CITY_STUDIO,
    category: 'Club',
    team: 'Man City',
    league: 'Premier League',
    type: 'Home',
    isPlayerEdition: true,
    status: 'pre-order',
    rating: 4.5,
    reviews: 32,
    description:
      'Pre-order the sky blue dominance. Engineered with ULTRAWEAVE aerodynamic paneling and iridescent metallic crest detailing in a tailored pro fit.',
    season: '2025/26',
    color: '6CABDD',
    gallery: createGallery(ASSETS.PRODUCTS.MAN_CITY_STUDIO, 'Man City', '6CABDD', ASSETS.PRODUCTS.MAN_CITY_HOME)
  },
  {
    id: '5',
    name: 'Brazil 2025 Seleção Home Kit',
    price: 1280,
    originalPrice: 1600,
    image: ASSETS.PRODUCTS.BRAZIL_HOME,
    category: 'National',
    team: 'Brazil',
    league: 'International',
    type: 'Home',
    isPlayerEdition: false,
    status: 'in-stock',
    rating: 4.6,
    reviews: 210,
    description: 'The iconic Seleção yellow restored with archival textured geometry inspired by Brazilian heritage.',
    season: '2025/26',
    color: 'FFDC02',
    gallery: createGallery(ASSETS.PRODUCTS.BRAZIL_HOME, 'Brazil', 'FFDC02')
  },
  {
    id: '6',
    name: 'Arsenal North London Home Kit 25/26',
    price: 1400,
    image: ASSETS.PRODUCTS.ARSENAL_HOME,
    category: 'Club',
    team: 'Arsenal',
    league: 'Premier League',
    type: 'Home',
    isPlayerEdition: false,
    status: 'out-of-stock',
    rating: 4.8,
    reviews: 156,
    description: 'Currently sold out in our Banani Vault. Classic red and white architectural paneling with minimal cannon crest.',
    season: '2025/26',
    color: 'EF0107',
    gallery: createGallery(ASSETS.PRODUCTS.ARSENAL_HOME, 'Arsenal', 'EF0107')
  },
  {
    id: '7',
    name: 'Liverpool Anfield Player Edition 25/26',
    price: 1800,
    originalPrice: 2080,
    image: ASSETS.PRODUCTS.LIVERPOOL_HOME,
    category: 'Club',
    team: 'Liverpool',
    league: 'Premier League',
    type: 'Home',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 4.9,
    reviews: 210,
    description: 'The iconic crimson of Anfield. Features subtle tonal pinstripes, retro heritage collar geometry, and Dri-FIT ADV knit.',
    season: '2025/26',
    color: 'C8102E',
    gallery: createGallery(ASSETS.PRODUCTS.LIVERPOOL_HOME, 'Liverpool', 'C8102E')
  },
  {
    id: '8',
    name: 'Juventus Bianconeri Match Kit 25/26',
    price: 1600,
    image: ASSETS.PRODUCTS.JUVENTUS_HOME,
    category: 'Club',
    team: 'Juventus',
    league: 'Serie A',
    type: 'Home',
    isPlayerEdition: false,
    status: 'in-stock',
    rating: 4.6,
    reviews: 98,
    description: 'Classic Bianconeri stripes engineered with a modern jacquard texture and metallic gold details.',
    season: '2025/26',
    color: '222222',
    gallery: createGallery(ASSETS.PRODUCTS.JUVENTUS_HOME, 'Juventus', '222222')
  },
  {
    id: '9',
    name: 'Bayern Munich Player ADV Home Kit',
    price: 1920,
    image: ASSETS.PRODUCTS.BAYERN_HOME,
    category: 'Club',
    team: 'Bayern',
    league: 'International',
    type: 'Home',
    isPlayerEdition: true,
    status: 'low-stock',
    rating: 4.8,
    reviews: 145,
    description: 'Dominance in triple red. Features a Bavarian diamond micro-knit pattern with zero-friction silicone crest.',
    season: '2025/26',
    color: 'DC052D',
    gallery: createGallery(ASSETS.PRODUCTS.BAYERN_HOME, 'Bayern', 'DC052D')
  },
  {
    id: '10',
    name: 'Lionel Messi MVP 2025 Commemorative Vault',
    price: 2080,
    image: ASSETS.UI.MVP_LEGACY_STUDIO,
    category: 'Club',
    team: 'Inter Miami',
    league: 'International',
    type: 'Special',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 5.0,
    reviews: 842,
    description:
      'The commemorative Messi MVP 2025 Vault Edition (Drop #042 / 100). Featuring official player-spec heat-bonded championship gold lettering, metallic micro-crests, and holographic NFC serial certification.',
    season: '2025/26',
    color: 'F7B5CD',
    gallery: createGallery(ASSETS.UI.MVP_LEGACY_STUDIO, 'Inter Miami', 'F7B5CD', ASSETS.PRODUCTS.MESSI_MVP_2025)
  },
  {
    id: '11',
    name: 'Al Nassr Player Edition Home Kit 25/26',
    price: 2000,
    image: ASSETS.PRODUCTS.AL_NASSR_HOME,
    category: 'Club',
    team: 'Al Nassr',
    league: 'International',
    type: 'Home',
    isPlayerEdition: true,
    status: 'pre-order',
    rating: 4.7,
    reviews: 180,
    description: 'Official match-issue jersey of Al Nassr featuring lightweight performance weave and royal blue collar detailing.',
    season: '2025/26',
    color: 'FCD116',
    gallery: createGallery(ASSETS.PRODUCTS.AL_NASSR_HOME, 'Al Nassr', 'FCD116')
  },
  {
    id: '12',
    name: 'Portugal Seleção Match Home Kit',
    price: 1680,
    originalPrice: 1920,
    image: ASSETS.PRODUCTS.PORTUGAL_HOME,
    category: 'National',
    team: 'Portugal',
    league: 'International',
    type: 'Home',
    isPlayerEdition: false,
    status: 'in-stock',
    rating: 4.8,
    reviews: 230,
    description: 'Deep Lusitano crimson with heritage green accents and moisture-wicking match weave.',
    season: '2025/26',
    color: 'E42518',
    gallery: createGallery(ASSETS.PRODUCTS.PORTUGAL_HOME, 'Portugal', 'E42518')
  }
];

export { AVAILABLE_SIZES, FONT_STYLES } from './shared/catalog';
