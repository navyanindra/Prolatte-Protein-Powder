import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { useGlobal } from '../App';
import api from '../src/services/api';
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';

/* -------------------- NORMALIZE PRODUCT -------------------- */

function normalizeProduct(raw: any): Product | null {
  if (!raw) return null;

  const id = raw._id?.toString() || raw.id || '1';
  const name = raw.name || 'ProLatte Protein Powder';
  const price = typeof raw.price === 'number' ? raw.price : 800;

  const discountPercentage =
    typeof raw.discountPercentage === 'number'
      ? raw.discountPercentage
      : 0;

  const discountedPrice =
    discountPercentage > 0
      ? Math.round(price - (price * discountPercentage) / 100)
      : null;

  return {
    id,
    name,
    price,
    discountedPrice,
    discountPercentage,
    description:
      raw.description ||
      'High-quality daily protein with added Vitamin K, B Complex, and Calcium.',
    category: 'Whey',
    image: raw.image || '/img1.png',
    gallery:
      raw.gallery && raw.gallery.length > 0
        ? raw.gallery
        : [raw.image || '/img1.png'],
    rating: 4.8,
    reviews: 1240,
    stock: 50,
    flavors: ['Vanilla', 'Chocolate', 'Strawberry'],
    nutrients: raw.nutrients || {
      protein: '15g',
      transfat: '0g',
      nutrientsCount: 31
    }
  };
}

/* -------------------- COMPONENT -------------------- */

const Shop: React.FC = () => {
  const { addToCart } = useGlobal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const products = res.data || [];
        const first = products[0];
        setProduct(
          normalizeProduct(first) ||
            normalizeProduct(MOCK_PRODUCTS[0])
        );
      } catch (err) {
        console.error('Product load failed:', err);
        setProduct(normalizeProduct(MOCK_PRODUCTS[0]));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="bg-white min-h-screen pb-24">
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="h-6 w-32 bg-gray-200 rounded mb-8 animate-pulse" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image skeleton */}
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="h-24 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-24 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-24 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-12 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="p-20 text-center text-gray-600">
        No product available.
      </div>
    );

  const finalPrice =
    product.discountedPrice ?? product.price;

  const galleryImages =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  const currentImage =
    galleryImages[selectedImageIndex] || product.image;

  const handleAddToCart = () => {
    addToCart(product, 'Vanilla', quantity);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Cart Success Toast */}
      {showToast && (
        <div 
          className="fixed top-24 right-6 z-[99999] bg-white border-2 border-green-500 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-right"
          style={{ minWidth: '320px' }}
        >
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-base">Added to cart!</p>
            <p className="text-sm text-gray-600">{quantity} item{quantity > 1 ? 's' : ''} added successfully</p>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-8">

        <Link
          to="/"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* -------- GALLERY -------- */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                    i === selectedImageIndex
                      ? 'border-[#0369a1]'
                      : 'border-transparent opacity-60'
                  }`}
                >
                  <img
                    src={img}
                    alt="thumbnail"
                    className="w-full h-24 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* -------- PRODUCT INFO -------- */}
          <div className="space-y-6">

            <h1 className="text-3xl font-black text-gray-900">
              {product.name}
            </h1>

            <div className="flex items-center space-x-3">
              {product.discountPercentage > 0 && (
                <span className="line-through text-gray-400">
                  Rs {product.price}
                </span>
              )}
              <span className="text-3xl font-black text-[#0369a1]">
                Rs {finalPrice}
              </span>

              {product.discountPercentage > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">
                  {product.discountPercentage}% OFF
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">
              This Daily Protein Supplement is designed for people who want to maintain overall health, strength, and vitality as part of their everyday lifestyle. Formulated with high-quality protein, it helps support muscle maintenance, energy levels, and post-activity recovery, making it suitable for adults of all ages. Ideal for individuals with increased protein needs, busy professionals, active adults, and those looking to improve their daily nutritional intake.
            </p>

            {/* -------- PRODUCT DETAILS -------- */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-3">Product Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Brand</span>
                  <p className="font-semibold text-gray-900">ProLatte</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Flavor</span>
                  <p className="font-semibold text-gray-900">Vanilla</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Item Type</span>
                  <p className="font-semibold text-gray-900">Protein Powder</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Age Range</span>
                  <p className="font-semibold text-gray-900">Adult</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-500 block mb-2">Product Benefits</span>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Bone Strength</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Energy Management</span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">Immune Support</span>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">Meal Replacement</span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Muscle Growth</span>
                </div>
              </div>
            </div>

            {/* -------- QUANTITY + ADD -------- */}
            <div className="flex items-center gap-4 pt-4">

              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() =>
                    setQuantity(Math.max(1, quantity - 1))
                  }
                  className="p-3"
                >
                  <Minus size={18} />
                </button>

                <span className="px-4 font-bold">
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#0369a1] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>

            {/* -------- NUTRITION PREVIEW -------- */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <div className="text-lg font-black text-[#0369a1]">
                  {product.nutrients?.protein}
                </div>
                <div className="text-xs text-gray-500">
                  Protein
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-black text-[#0369a1]">
                  {product.nutrients?.transfat}
                </div>
                <div className="text-xs text-gray-500">
                  Trans Fat
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-black text-[#0369a1]">
                  {product.nutrients?.nutrientsCount}
                </div>
                <div className="text-xs text-gray-500">
                  Nutrients
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;