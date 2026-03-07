
export interface Product {
  id: string;
  name: string;
  price: number;
  discountPercentage?: number;
  discountedPrice?: number;
  description: string;
  category: 'Whey' | 'Plant-Based' | 'Casein' | 'Creatine' | 'Vitamins';
  image: string;
  gallery?: string[];
  rating: number;
  reviews: number;
  stock: number;
  flavors: string[];
  nutrients: {
    protein: string;
    transfat: string;
    nutrientsCount: number;
  };
}

export interface CartItem extends Product {
  quantity: number;
  selectedFlavor: string;
}

export interface AddressBookItem {
  id: string;
  label?: string;
  fullName: string;
  email: string;
  addressLine: string;
  city: string;
  zip: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  addresses?: AddressBookItem[];
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: string;
  trackingNumber?: string;
}

export type SortOption = 'price-low' | 'price-high' | 'newest' | 'rating';
