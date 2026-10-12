
import { Product } from './types';
import { ASSETS } from './assets/images';

export const CURRENCY_SYMBOL = '৳';

const getTextColor = (hex: string) => {
    const lightColors = ['F7B5CD', 'FCD116', 'FFFFFF', 'E5C468', '6CABDD', '75AADB'];
    return lightColors.includes(hex) ? '000000' : 'FFFFFF';
};

const createGallery = (mainImage: string, team: string, color: string) => {
    const textCol = getTextColor(color);
    return [
        mainImage,
        `https://placehold.co/800x1000/${color}/${textCol}?text=${encodeURIComponent(team)}+Back+View&font=oswald`,
        `https://placehold.co/800x1000/${color}/${textCol}?text=${encodeURIComponent(team)}+Graphic+Detail&font=oswald`,
        `https://placehold.co/800x1000/${color}/${textCol}?text=${encodeURIComponent(team)}+Lifestyle&font=oswald`
    ];
};

/**
 * Seed catalogue. The live catalogue is served from D1 (/api/products);
 * this list generates migrations/0002_seed.sql and is the offline fallback.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'FC Barcelona Home Kit 25/26',
    price: 2000,
    originalPrice: 2400,
    image: ASSETS.PRODUCTS.BARCELONA_HOME, 
    category: 'Club',
    team: 'Barcelona',
    league: 'La Liga',
    type: 'Home',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 4.9,
    reviews: 124,
    description: 'Experience the authentic feel of Camp Nou with the official 2025/26 Player Edition Home Kit. Features Dri-FIT ADV technology for breathability.',
    season: '2025/26',
    color: 'A50044',
    gallery: createGallery(ASSETS.PRODUCTS.BARCELONA_HOME, 'Barcelona', 'A50044')
  },
  {
    id: '2',
    name: 'Real Madrid Home Kit 25/26',
    price: 1400,
    image: ASSETS.PRODUCTS.REAL_MADRID_HOME,
    category: 'Club',
    team: 'Real Madrid',
    league: 'La Liga',
    type: 'Home',
    isPlayerEdition: false,
    status: 'low-stock',
    rating: 4.7,
    reviews: 89,
    description: 'The elegant new home kit for the kings of Europe. Standard stadium edition fit in the iconic crisp white.',
    season: '2025/26',
    color: '111111',
    gallery: createGallery(ASSETS.PRODUCTS.REAL_MADRID_HOME, 'Real Madrid', '111111')
  },
  {
    id: '3',
    name: 'Argentina 3-Star Home Kit',
    price: 2200,
    image: ASSETS.PRODUCTS.ARGENTINA_HOME,
    category: 'National',
    team: 'Argentina',
    league: 'International',
    type: 'Home',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 5.0,
    reviews: 450,
    description: 'Wear the champions badge with pride. This is the authentic 3-star jersey worn by the world champions.',
    season: '2025/26',
    color: '75AADB',
    gallery: createGallery(ASSETS.PRODUCTS.ARGENTINA_HOME, 'Argentina', '75AADB')
  },
  {
    id: '4',
    name: 'Manchester City Home Kit',
    price: 1680,
    image: ASSETS.PRODUCTS.MAN_CITY_HOME,
    category: 'Club',
    team: 'Man City',
    league: 'Premier League',
    type: 'Home',
    isPlayerEdition: true,
    status: 'pre-order',
    rating: 4.5,
    reviews: 32,
    description: 'Pre-order the sky blue dominance. Expected delivery: Jan 20th. Player edition slim fit.',
    season: '2025/26',
    color: '6CABDD',
    gallery: createGallery(ASSETS.PRODUCTS.MAN_CITY_HOME, 'Man City', '6CABDD')
  },
  {
    id: '5',
    name: 'Brazil 2025 Home Kit',
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
    description: 'The classic Seleção yellow. Textured pattern inspired by Brazilian nature.',
    season: '2025/26',
    color: 'FFDC02',
    gallery: createGallery(ASSETS.PRODUCTS.BRAZIL_HOME, 'Brazil', 'FFDC02')
  },
  {
    id: '6',
    name: 'Arsenal Home Kit 25/26',
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
    description: 'Currently out of stock. The classic red and white design has been a fan favorite this season.',
    season: '2025/26',
    color: 'EF0107',
    gallery: createGallery(ASSETS.PRODUCTS.ARSENAL_HOME, 'Arsenal', 'EF0107')
  },
  {
    id: '7',
    name: 'Liverpool Home Kit 25/26',
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
    description: 'The iconic red of Anfield. Features subtle pinstripes and a classic collar design for the new season.',
    season: '2025/26',
    color: 'C8102E',
    gallery: createGallery(ASSETS.PRODUCTS.LIVERPOOL_HOME, 'Liverpool', 'C8102E')
  },
  {
    id: '8',
    name: 'Juventus Home Kit 25/26',
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
    description: 'Classic Bianconeri stripes with a modern digital distortion effect. Standard fit.',
    season: '2025/26',
    color: '222222',
    gallery: createGallery(ASSETS.PRODUCTS.JUVENTUS_HOME, 'Juventus', '222222')
  },
  {
    id: '9',
    name: 'Bayern Munich Home Kit',
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
    description: 'Dominance in Red. The new Bayern home kit features a diamond pattern inspired by the Bavarian flag.',
    season: '2025/26',
    color: 'DC052D',
    gallery: createGallery(ASSETS.PRODUCTS.BAYERN_HOME, 'Bayern', 'DC052D')
  },
  {
    id: '10',
    name: 'Lionel Messi MVP 2025 Limited Edition',
    price: 2080,
    image: ASSETS.PRODUCTS.MESSI_MVP_2025,
    category: 'Club',
    team: 'Inter Miami',
    league: 'International',
    type: 'Special',
    isPlayerEdition: true,
    status: 'in-stock',
    rating: 5.0,
    reviews: 842,
    description: 'The commemorative Messi MVP 2025 Edition. Featuring exclusive graphic overlays as seen on the GOAT himself. Authentic player version with performance knit technology.',
    season: '2025/26',
    color: 'F7B5CD',
    gallery: createGallery(ASSETS.PRODUCTS.MESSI_MVP_2025, 'Inter Miami', 'F7B5CD')
  },
  {
    id: '11',
    name: 'Al Nassr Home Kit 25/26',
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
    description: 'Shine in yellow. The official home jersey of Al Nassr featuring premium fabric technology.',
    season: '2025/26',
    color: 'FCD116',
    gallery: createGallery(ASSETS.PRODUCTS.AL_NASSR_HOME, 'Al Nassr', 'FCD116')
  },
  {
    id: '12',
    name: 'Portugal Home Kit 2025',
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
    description: 'Deep red with green accents. Support Portugal in style with this stadium home jersey.',
    season: '2025/26',
    color: 'E42518',
    gallery: createGallery(ASSETS.PRODUCTS.PORTUGAL_HOME, 'Portugal', 'E42518')
  }
];

export { AVAILABLE_SIZES, FONT_STYLES } from './shared/catalog';
