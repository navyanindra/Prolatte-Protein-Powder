
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import About from './pages/About';
import Contact from './pages/Contact';
import OrderConfirmation from './pages/OrderConfirmation';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { CartItem, User, Product } from './types';

const FLIPKART_PRODUCT_URL =
  'https://www.flipkart.com/prolatte-daily-protein-powder-whey/p/itmbc939e2306a76?pid=PSLHJPKYAXDZGGNH&lid=LSTPSLHJPKYAXDZGGNHHUBZ0I&marketplace=FLIPKART&q=prolatte+protein+powder&store=hlc%2Fetg%2F1rx&srno=s_1_1&otracker=AS_Query_OrganicAutoSuggest_1_19_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_1_19_na_na_na&fm=search-autosuggest&iid=bb85d94f-137d-44e7-a4d4-8db1199c8236.PSLHJPKYAXDZGGNH.SEARCH&ppt=sp&ppn=sp&ssid=lpsbc6qzww0000001772877713322&qH=d16aa1478d1049e1&ov_redirect=true&ov_redirect=true';

const ExternalRedirect: React.FC<{ to: string }> = ({ to }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
};

const ADMIN_LOGIN_PATH = '/portal/hf-admin-7x93/login';
const ADMIN_PORTAL_PATH = '/portal/hf-admin-7x93';
const ADMIN_SESSION_STARTED_AT_KEY = 'admin_session_started_at';
const ADMIN_LAST_ACTIVITY_AT_KEY = 'admin_last_activity_at';
const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ADMIN_MAX_SESSION_MS = 8 * 60 * 60 * 1000;

interface GlobalContextType {
  cart: CartItem[];
  addToCart: (product: Product, flavor: string, quantity: number) => void;
  removeFromCart: (id: string, flavor: string) => void;
  updateQuantity: (id: string, flavor: string, delta: number) => void;
  clearCart: () => void;
  user: User | null;
  login: (userData: Partial<User> & { email: string }) => void;
  logout: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within GlobalProvider');
  return context;
};

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, flavor: string, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedFlavor === flavor);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.selectedFlavor === flavor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, selectedFlavor: flavor, quantity }];
    });
  };

  const removeFromCart = (id: string, flavor: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedFlavor === flavor)));
  };

  const updateQuantity = (id: string, flavor: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id && item.selectedFlavor === flavor
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const login = (userData: Partial<User> & { email: string }) => {
    const email = userData.email;
    const safeName = userData.name?.trim() || 'User';
    const safeRole = userData.role || 'user';

    const loggedInUser: User = {
      id: userData.id || email,
      name: safeName,
      email,
      role: safeRole,
      avatar:
        userData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      phone: userData.phone,
      addresses: userData.addresses || []
    };

    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem(ADMIN_SESSION_STARTED_AT_KEY);
    localStorage.removeItem(ADMIN_LAST_ACTIVITY_AT_KEY);
  };

  const AppShell: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdminRoute = location.pathname.startsWith('/portal/hf-admin-7x93');

    useEffect(() => {
      if (!isAdminRoute || user?.role !== 'admin') return;

      const now = Date.now();
      const startedAt = Number(localStorage.getItem(ADMIN_SESSION_STARTED_AT_KEY) || now);
      if (!localStorage.getItem(ADMIN_SESSION_STARTED_AT_KEY)) {
        localStorage.setItem(ADMIN_SESSION_STARTED_AT_KEY, String(now));
      }
      if (!localStorage.getItem(ADMIN_LAST_ACTIVITY_AT_KEY)) {
        localStorage.setItem(ADMIN_LAST_ACTIVITY_AT_KEY, String(now));
      }

      const markActivity = () => {
        localStorage.setItem(ADMIN_LAST_ACTIVITY_AT_KEY, String(Date.now()));
      };

      const forceAdminLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem(ADMIN_SESSION_STARTED_AT_KEY);
        localStorage.removeItem(ADMIN_LAST_ACTIVITY_AT_KEY);
        navigate(ADMIN_LOGIN_PATH, { replace: true });
      };

      const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach((eventName) => window.addEventListener(eventName, markActivity));

      const interval = window.setInterval(() => {
        const currentTime = Date.now();
        const lastActivity = Number(localStorage.getItem(ADMIN_LAST_ACTIVITY_AT_KEY) || currentTime);
        const sessionStart = Number(localStorage.getItem(ADMIN_SESSION_STARTED_AT_KEY) || startedAt);

        const idleElapsed = currentTime - lastActivity;
        const sessionElapsed = currentTime - sessionStart;
        if (idleElapsed > ADMIN_IDLE_TIMEOUT_MS || sessionElapsed > ADMIN_MAX_SESSION_MS) {
          forceAdminLogout();
        }
      }, 15000);

      return () => {
        window.clearInterval(interval);
        events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      };
    }, [isAdminRoute, navigate, user?.role]);

    return (
      <div className="flex flex-col min-h-screen">
        {!isAdminRoute && <Navbar />}
        <main className={`flex-grow ${isAdminRoute ? '' : 'pt-16'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Navigate to="/cart" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin" element={<Navigate to={ADMIN_LOGIN_PATH} replace />} />
            <Route path={ADMIN_LOGIN_PATH} element={<AdminLogin />} />
            <Route path={ADMIN_PORTAL_PATH} element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to={ADMIN_LOGIN_PATH} replace />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/confirmation/:id" element={user ? <OrderConfirmation /> : <Navigate to="/login" replace />} />
            {/* <Route path="/confirmation-preview" element={<OrderConfirmation />} /> */}
            <Route path="/flipkart" element={<ExternalRedirect to={FLIPKART_PRODUCT_URL} />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h1 className="text-6xl font-bold primary-text">404</h1>
              <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
              <a href="/" className="mt-6 px-6 py-2 primary-bg text-white rounded-full">Go Home</a>
            </div>} />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
      </div>
    );
  };

  return (
    <GlobalContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, user, login, logout }}>
      <Router>
        <AppShell />
      </Router>
    </GlobalContext.Provider>
  );
};

export default App;
