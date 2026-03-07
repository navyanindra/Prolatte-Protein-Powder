
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ProLatte Protein powder',
    price: 800,
    description: 'High-quality doctor-recommended daily protein with added Vitamin K, B Complex, and Calcium. Perfect for muscle recovery and daily nutrition.',
    category: 'Whey',
    image: '/img1.png',
    gallery: ['/img1.png', '/img2.png', '/img3.png'],
    rating: 4.8,
    reviews: 1240,
    stock: 50,
    flavors: ['Vanilla', 'Chocolate', 'Strawberry'],
    nutrients: {
      protein: '15g',
      transfat: '0g',
      nutrientsCount: 31
    }
  }
];

export const CATEGORIES = ['All', 'Whey', 'Plant-Based', 'Casein', 'Creatine', 'Vitamins'];

export const TESTIMONIALS = [
  {
    name: "Alex Johnson",
    role: "Fitness Coach",
    content: "ProLatte is the only brand I trust for my clients. The transparency in their nutritional labeling is unmatched.",
    rating: 5
  },
  {
    name: "Sarah Miller",
    role: "Marathon Runner",
    content: "The Vanilla flavor is actually delicious. It mixes perfectly without any clumps. Highly recommend!",
    rating: 5
  }
];
