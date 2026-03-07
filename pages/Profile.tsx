import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Info,
  ShieldCheck,
  FileText,
  Headphones,
  LogOut,
  Package,
  RefreshCw,
  Clock3,
  Truck,
  Edit,
  User,
  Phone,
  Mail,
  Save,
  X,
  MapPin,
  Navigation,
  Calendar,
  Box,
  Weight,
  Ruler,
  PhoneCall,
  CheckCircle2,
  Circle,
  ArrowRight
} from 'lucide-react';
import { useGlobal } from '../App';
import api from '../src/services/api';
import { isValidEmail, isValidPhone, normalizePhone, formatPhoneDisplay } from '../src/utils/validation';

const TRACKING_STEPS = [
  'Order Placed',
  'Order Confirmed',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

const statusToStepTitle = (status?: string) => {
  if (!status) return '';
  const normalized = status.toLowerCase().trim();
  if (normalized === 'placed') return 'Order Placed';
  if (normalized === 'confirmed') return 'Order Confirmed';
  if (normalized === 'shipped') return 'Shipped';
  if (normalized === 'out for delivery') return 'Out for Delivery';
  if (normalized === 'delivered') return 'Delivered';
  return status;
};

const normalizeTrackingSteps = (order: any) => {
  const providedSteps = Array.isArray(order?.trackingSteps)
    ? order.trackingSteps
    : [];

  const completedTitleSet = new Set(
    providedSteps
      .filter((step: any) => step?.completed && step?.title)
      .map((step: any) => String(step.title).trim())
  );

  const statusTitle = statusToStepTitle(order?.orderStatus);
  if (statusTitle) {
    const statusIndex = TRACKING_STEPS.indexOf(statusTitle);
    if (statusIndex >= 0) {
      TRACKING_STEPS.slice(0, statusIndex + 1).forEach((title) =>
        completedTitleSet.add(title)
      );
    }
  }

  return TRACKING_STEPS.map((title) => {
    const originalStep = providedSteps.find(
      (step: any) => String(step?.title || '').trim() === title
    );
    return {
      title,
      completed: completedTitleSet.has(title),
      date: originalStep?.date || null
    };
  });
};

const getCurrentTrackingStep = (order: any) => {
  const steps = normalizeTrackingSteps(order);
  const current = [...steps].reverse().find((step) => step.completed);
  return current?.title || 'Order Placed';
};

const getTrackingProgress = (order: any) => {
  const current = getCurrentTrackingStep(order);
  const idx = TRACKING_STEPS.indexOf(current);
  if (idx < 0) return 20;
  return Math.round(((idx + 1) / TRACKING_STEPS.length) * 100);
};

const normalizeAddress = (address: any) => ({
  id: String(address?.id || address?._id || ''),
  label: address?.label || 'Address',
  fullName: address?.fullName || '',
  email: address?.email || '',
  addressLine: address?.addressLine || '',
  city: address?.city || '',
  zip: address?.zip || '',
  isDefault: Boolean(address?.isDefault)
});

const toAddressList = (addresses: any[] = []) =>
  addresses.map((item) => normalizeAddress(item));

const Profile: React.FC = () => {
  const { user, logout, login } = useGlobal();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);
  const [addressMessage, setAddressMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<any | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [addressDraft, setAddressDraft] = useState({
    label: 'Home',
    fullName: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    zip: '',
    isDefault: false
  });

  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileEditDraft, setProfileEditDraft] = useState({
    name: '',
    phone: ''
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered'>('all');

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async (showRefreshLoader = false) => {
      if (!user?.email) return;

      try {
        if (showRefreshLoader) {
          setIsRefreshing(true);
        } else {
          setLoadingOrders(true);
        }
        const res = await api.get(
          `/orders/user/${encodeURIComponent(user.email)}`
        );
        if (!mounted) return;
        setOrders(res.data || []);
        setLastRefreshedAt(new Date());
      } catch (err) {
        console.error('Failed to load user orders', err);
      } finally {
        if (!mounted) return;
        if (showRefreshLoader) {
          setIsRefreshing(false);
        } else {
          setLoadingOrders(false);
        }
      }
    };

    fetchOrders();

    const intervalId = window.setInterval(() => {
      fetchOrders(true);
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [user?.email]);

  if (!user) return null;

  const activeOrder =
    orders.find((order) => getCurrentTrackingStep(order) !== 'Delivered') ||
    orders[0];

  const activeOrderSteps = activeOrder
    ? normalizeTrackingSteps(activeOrder)
    : [];
  const activeOrderProgress = activeOrder
    ? getTrackingProgress(activeOrder)
    : 0;
  const activeOrderCurrentStep = activeOrder
    ? getCurrentTrackingStep(activeOrder)
    : '';
  const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];

  const resetAddressDraft = (address?: any) => {
    if (address) {
      setAddressDraft({
        label: address.label || 'Address',
        fullName: address.fullName || '',
        email: address.email || user.email || '',
        phone: user.phone || '',
        addressLine: address.addressLine || '',
        city: address.city || '',
        zip: address.zip || '',
        isDefault: Boolean(address.isDefault)
      });
      setEditingAddressId(String(address.id || address._id));
      return;
    }

    setAddressDraft({
      label: 'Home',
      fullName: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      addressLine: '',
      city: '',
      zip: '',
      isDefault: savedAddresses.length === 0
    });
    setEditingAddressId(null);
  };

  const syncUserFromAddressResponse = (updatedUser: any, successText: string) => {
    login({
      id: updatedUser?._id || user.id,
      name: updatedUser?.name || user.name,
      email: updatedUser?.email || user.email,
      role: updatedUser?.role || user.role,
      phone: updatedUser?.phone || user.phone,
      addresses: toAddressList(updatedUser?.addresses || []),
      avatar: user.avatar
    });

    setAddressMessage({ type: 'success', text: successText });
    setAddressErrors({});
  };

  const validateAddressDraft = () => {
    const errors: Record<string, string> = {};
    if (!addressDraft.fullName.trim()) errors.fullName = 'Full name is required';
    if (!addressDraft.email.trim()) errors.email = 'Email is required';
    if (addressDraft.email && !isValidEmail(addressDraft.email)) {
      errors.email = 'Enter a valid email';
    }
    if (!addressDraft.phone.trim()) errors.phone = 'Phone number is required';
    if (addressDraft.phone && !isValidPhone(addressDraft.phone)) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!addressDraft.addressLine.trim()) errors.addressLine = 'Address is required';
    if (!addressDraft.city.trim()) errors.city = 'City is required';
    if (!addressDraft.zip.trim()) errors.zip = 'Pincode is required';
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateAddressDraft()) return;
    try {
      setIsAddressSubmitting(true);
      setAddressMessage(null);

      const payload = {
        userEmail: user.email,
        label: addressDraft.label,
        fullName: addressDraft.fullName.trim(),
        email: addressDraft.email.trim(),
        phone: normalizePhone(addressDraft.phone),
        addressLine: addressDraft.addressLine.trim(),
        city: addressDraft.city.trim(),
        zip: addressDraft.zip.trim(),
        makeDefault: Boolean(addressDraft.isDefault)
      };

      const res = editingAddressId
        ? await api.patch(`/auth/profile/address/${editingAddressId}`, payload)
        : await api.put('/auth/profile/address', payload);

      syncUserFromAddressResponse(
        res.data?.user,
        editingAddressId ? 'Address updated successfully.' : 'Address added successfully.'
      );
      resetAddressDraft();
    } catch (error: any) {
      setAddressMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to save address.'
      });
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const res = await api.patch(`/auth/profile/address/${addressId}/default`, {
        userEmail: user.email
      });
      syncUserFromAddressResponse(res.data?.user, 'Default address updated.');
    } catch (error: any) {
      setAddressMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to update default address.'
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setIsAddressSubmitting(true);
      const res = await api.delete(`/auth/profile/address/${addressId}`, {
        data: { userEmail: user.email }
      });
      syncUserFromAddressResponse(res.data?.user, 'Address deleted successfully.');
      setAddressToDelete(null);
      if (editingAddressId === addressId) {
        resetAddressDraft();
      }
    } catch (error: any) {
      setAddressMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to delete address.'
      });
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const openProfileEditModal = () => {
    setProfileEditDraft({
      name: user.name || '',
      phone: user.phone || ''
    });
    setProfileErrors({});
    setIsProfileEditModalOpen(true);
  };

  const closeProfileEditModal = () => {
    setIsProfileEditModalOpen(false);
    setProfileErrors({});
  };

  const validateProfileDraft = () => {
    const errors: Record<string, string> = {};
    if (!profileEditDraft.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!profileEditDraft.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (profileEditDraft.phone && !isValidPhone(profileEditDraft.phone)) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileDraft()) return;

    try {
      setIsProfileSubmitting(true);
      const res = await api.patch('/auth/profile', {
        name: profileEditDraft.name.trim(),
        phone: normalizePhone(profileEditDraft.phone)
      });

      login({
        id: res.data.user?._id || user.id,
        name: res.data.user?.name || user.name,
        email: res.data.user?.email || user.email,
        role: res.data.user?.role || user.role,
        phone: res.data.user?.phone || user.phone,
        addresses: toAddressList(res.data.user?.addresses || user.addresses),
        avatar: user.avatar
      });

      setAddressMessage({ type: 'success', text: 'Profile updated successfully!' });
      closeProfileEditModal();
    } catch (error: any) {
      setProfileErrors({
        _general: error?.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
              <div className="relative inline-block mb-6">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full bg-gray-100 p-1 border-2 primary-border mx-auto"
                />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-sky-500 rounded-full border-4 border-white" />
              </div>

              <h2 className="text-xl font-black text-gray-900">
                {user.name}
              </h2>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                {user.role} account
              </p>

              <p className="mt-3 text-sm text-gray-500 font-medium break-all">
                {user.email}
              </p>
              <p className="mt-2 text-sm text-gray-500 font-medium">
                {user.phone ? formatPhoneDisplay(user.phone) : 'No phone number saved'}
              </p>

              <button
                onClick={openProfileEditModal}
                className="mt-5 w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 transition border border-sky-200"
              >
                <Edit size={18} />
                <span className="text-sm">Edit Profile</span>
              </button>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl font-bold text-red-500 bg-white hover:bg-red-50 transition shadow-sm border border-gray-100"
            >
              <LogOut size={20} />
              <span className="text-sm">Sign out</span>
            </button>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">

            {/* Header */}
            <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h1 className="text-2xl font-black text-gray-900">
                Welcome back, {user.name.split(' ')[0] || user.name}
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Manage your HealthFirst Life Sciences account and quickly jump to other important pages.
              </p>
            </header>

            {/* Shopping Section */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">

              {/* ========== RECENT ORDERS - NOW AT TOP ========== */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900">
                    Recent Orders
                  </h3>
                  <div className="flex items-center gap-3">
                    {/* Order Filter */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setOrderFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                          orderFilter === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setOrderFilter('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                          orderFilter === 'active'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setOrderFilter('delivered')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                          orderFilter === 'delivered'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Delivered
                      </button>
                    </div>
                    
                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user?.email) return;
                          try {
                            setIsRefreshing(true);
                            const res = await api.get(
                              `/orders/user/${encodeURIComponent(user.email)}`
                            );
                            setOrders(res.data || []);
                            setLastRefreshedAt(new Date());
                          } catch (err) {
                            console.error('Failed to refresh orders', err);
                          } finally {
                            setIsRefreshing(false);
                          }
                        }}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#0369a1] hover:opacity-80 transition"
                      >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    )}
                  </div>
                </div>

                {loadingOrders && (
                  <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-12 text-center">
                    <RefreshCw size={40} className="mx-auto text-gray-400 animate-spin mb-4" />
                    <p className="text-sm font-semibold text-gray-600">
                      Loading your orders...
                    </p>
                  </div>
                )}

                {!loadingOrders && orders.length === 0 && (
                  <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h4 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h4>
                    <p className="text-sm text-gray-500 mb-6">
                      Start shopping to see your orders here
                    </p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition"
                    >
                      <ShoppingBag size={18} />
                      Browse Products
                    </Link>
                  </div>
                )}

                {!loadingOrders && orders.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders
                      .filter(order => {
                        if (orderFilter === 'all') return true;
                        const trackingStep = getCurrentTrackingStep(order);
                        if (orderFilter === 'delivered') return trackingStep === 'Delivered';
                        if (orderFilter === 'active') return trackingStep !== 'Delivered';
                        return true;
                      })
                      .map((order, idx) => {
                      const trackingStep = getCurrentTrackingStep(order);
                      const progress = getTrackingProgress(order);
                      
                      return (
                        <button
                          key={order._id ?? idx}
                          onClick={() => setSelectedOrderForTracking(order)}
                          className="text-left rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 hover:border-sky-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Order ID</p>
                              <p className="text-lg font-black text-gray-900">
                                {order.orderNumber}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total</p>
                              <p className="text-xl font-black text-gray-900">
                                ₹{Number(order.totalAmount ?? 0).toFixed(0)}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-700"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-semibold">
                              {progress}% Complete
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl ${
                                trackingStep === "Delivered"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : trackingStep === "Shipped" || trackingStep === "Out for Delivery"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              }`}
                            >
                              <Truck size={14} />
                              {trackingStep}
                            </span>
                            
                            <ArrowRight size={18} className="text-gray-400" />
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Saved Addresses Section */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Saved addresses</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddressModalOpen(true);
                    setAddressMessage(null);
                    setAddressErrors({});
                    setAddressToDelete(null);
                    resetAddressDraft();
                  }}
                  className="text-sm font-bold text-[#0369a1] hover:opacity-80 transition"
                >
                  Manage addresses
                </button>
              </div>
              {savedAddresses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No address saved yet. Add one during checkout and it will appear here.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddresses.map((address: any, index: number) => (
                    <div
                      key={address?.id || address?._id || index}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-gray-900">
                          {address.fullName || user.name}
                        </p>
                        {address?.isDefault ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#0369a1]/10 text-[#0369a1]">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.addressLine}, {address.city} - {address.zip}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{address.email || user.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Help Section */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-black text-gray-900">
                Help & information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Link
                  to="/about"
                  className="flex items-center px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <Info className="text-sky-600 mr-3" size={22} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      About ProLatte
                    </p>
                    <p className="text-xs text-gray-500">
                      Learn more about the product
                    </p>
                  </div>
                </Link>

                <Link
                  to="/contact"
                  className="flex items-center px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <Headphones className="text-sky-600 mr-3" size={22} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Contact support
                    </p>
                    <p className="text-xs text-gray-500">
                      Reach out to the HealthFirst team
                    </p>
                  </div>
                </Link>

                <Link
                  to="/privacy"
                  className="flex items-center px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <FileText className="text-sky-600 mr-3" size={22} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Privacy policy
                    </p>
                    <p className="text-xs text-gray-500">
                      How we handle your data
                    </p>
                  </div>
                </Link>

                <Link
                  to="/terms"
                  className="flex items-center px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <FileText className="text-sky-600 mr-3" size={22} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Terms & conditions
                    </p>
                    <p className="text-xs text-gray-500">
                      Usage and purchase terms
                    </p>
                  </div>
                </Link>

              </div>
            </section>

          </main>
        </div>
      </div>

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-900">Manage addresses</h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            {addressMessage && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
                  addressMessage.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {addressMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {savedAddresses.map((address: any, index: number) => {
                const id = String(address?.id || address?._id || index);
                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">{address.fullName}</p>
                      {address?.isDefault ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#0369a1]/10 text-[#0369a1]">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.addressLine}, {address.city} - {address.zip}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{address.email}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetAddressDraft(address);
                          setAddressMessage(null);
                        }}
                        className="text-xs font-semibold px-2 py-1 rounded-md border border-gray-300 text-gray-700"
                      >
                        Edit
                      </button>
                      {!address?.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(id)}
                          className="text-xs font-semibold px-2 py-1 rounded-md border border-[#0369a1]/40 text-[#0369a1]"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAddressToDelete({ ...address, id })}
                        className="text-xs font-semibold px-2 py-1 rounded-md border border-red-200 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-black text-gray-900">
                  {editingAddressId ? 'Edit address' : 'Add new address'}
                </h4>
                {editingAddressId ? (
                  <button
                    type="button"
                    onClick={() => resetAddressDraft()}
                    className="text-xs font-semibold text-gray-600"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  placeholder="Address label (Home, Work)"
                  value={addressDraft.label}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
                <input
                  placeholder="Full Name"
                  value={addressDraft.fullName}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    addressErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <input
                  placeholder="Email"
                  value={addressDraft.email}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    addressErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <input
                  placeholder="Phone Number"
                  value={addressDraft.phone}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    addressErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <input
                  placeholder="City"
                  value={addressDraft.city}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    addressErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
              </div>
              <input
                placeholder="Address Line"
                value={addressDraft.addressLine}
                onChange={(e) =>
                  setAddressDraft((prev) => ({ ...prev, addressLine: e.target.value }))
                }
                className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm ${
                  addressErrors.addressLine ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              <input
                placeholder="Pincode"
                value={addressDraft.zip}
                onChange={(e) =>
                  setAddressDraft((prev) => ({ ...prev, zip: e.target.value }))
                }
                className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm ${
                  addressErrors.zip ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={addressDraft.isDefault}
                  onChange={(e) =>
                    setAddressDraft((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                />
                Set as default address
              </label>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={isAddressSubmitting}
                  className="rounded-xl bg-[#0369a1] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {isAddressSubmitting
                    ? 'Saving...'
                    : editingAddressId
                    ? 'Update address'
                    : 'Add address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addressToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-black text-gray-900">Delete this address?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This address will be removed from your account.
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">{addressToDelete.fullName}</p>
              <p className="text-sm text-gray-600 mt-1">
                {addressToDelete.addressLine}, {addressToDelete.city} - {addressToDelete.zip}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAddress(addressToDelete.id)}
                disabled={isAddressSubmitting}
                className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isAddressSubmitting ? 'Deleting...' : 'Delete address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isProfileEditModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Edit Profile</h3>
              <button
                onClick={closeProfileEditModal}
                disabled={isProfileSubmitting}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {profileErrors._general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-medium">{profileErrors._general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={profileEditDraft.name}
                  onChange={(e) =>
                    setProfileEditDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition ${
                    profileErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {profileErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{profileErrors.name}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={profileEditDraft.phone}
                  onChange={(e) =>
                    setProfileEditDraft((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition ${
                    profileErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {profileErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{profileErrors.phone}</p>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <p className="text-sm text-gray-500 break-all">{user.email}</p>
                <p className="mt-2 text-xs text-gray-400">Email cannot be changed</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeProfileEditModal}
                disabled={isProfileSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isProfileSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-60"
              >
                <Save size={18} />
                <span>{isProfileSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ORDER TRACKING MODAL ========== */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-[2.5rem] flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <Navigation className="text-white" size={20} />
                  </div>
                  Live Order Tracking
                </h3>
                <p className="text-sm text-gray-500 mt-2 ml-13">
                  Real-time updates for Order <span className="font-bold text-gray-900">{selectedOrderForTracking.orderNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForTracking(null)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="rounded-3xl border-2 border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-8 shadow-xl">
                {/* Tracking Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Package className="text-white" size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</p>
                      <p className="text-sm font-black text-gray-900 mt-1">
                        {selectedOrderForTracking.orderNumber || "HF-2026-000000"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Calendar className="text-white" size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Est. Delivery</p>
                      <p className="text-sm font-black text-gray-900 mt-1">
                        {selectedOrderForTracking.trackingInfo?.estimatedDelivery 
                          ? new Date(selectedOrderForTracking.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <PhoneCall className="text-white" size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">For Queries</p>
                      <a href="tel:+919908041149" className="text-sm font-black text-blue-600 hover:text-blue-700 transition mt-1 block">
                        +91 9908041149
                      </a>
                    </div>
                  </div>
                </div>

                {/* Package Journey */}
                <div>
                  <h4 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin className="text-sky-600" size={24} />
                    Package Journey
                  </h4>
                  
                  <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg">
                    <div className="space-y-6">
                      {/* Origin */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <CheckCircle2 className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-green-600">Origin</p>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              Dispatched
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 font-medium">
                            {selectedOrderForTracking.trackingInfo?.originLocation || 
                              "Bendoorwell, Bendoor, Mangaluru, Karnataka, Dakshina Kannada - 575002"}
                          </p>
                        </div>
                      </div>

                      {/* Show Transit Route and Current Location only if NOT delivered */}
                      {selectedOrderForTracking.orderStatus?.toLowerCase() !== "delivered" && (
                        <>
                          {/* Transit Route */}
                          <div className="ml-6 flex items-center gap-4">
                            <div className="w-0.5 h-16 bg-gradient-to-b from-green-400 via-blue-400 to-blue-500 rounded-full"></div>
                            <div className="flex-1 opacity-75">
                              <p className="text-xs text-gray-500 mb-2">Transit Route</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded">Bendoor</span>
                                <ArrowRight size={12} className="text-gray-400" />
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded">Mangaluru</span>
                                <ArrowRight size={12} className="text-gray-400" />
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded">Regional Hub</span>
                              </div>
                            </div>
                          </div>

                          {/* Current Location */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                              <Circle className="text-white fill-current" size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-black text-blue-600">Current Location</p>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full animate-pulse">
                                  In Transit
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-2 font-medium">
                                {/* Show default location for placed and confirmed, admin-entered location for shipped/out_for_delivery */}
                                {["placed", "confirmed"].includes(selectedOrderForTracking.orderStatus?.toLowerCase() || "")
                                  ? "Bendoorwell, Bendoor, Mangaluru - Processing"
                                  : (selectedOrderForTracking.trackingInfo?.currentLocation || "Bendoorwell, Bendoor, Mangaluru - Processing")
                                }
                              </p>
                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Clock3 size={12} />
                                Last updated: {selectedOrderForTracking.trackingInfo?.lastUpdated 
                                  ? new Date(selectedOrderForTracking.trackingInfo.lastUpdated).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : new Date().toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                }
                              </p>
                            </div>
                          </div>

                          {/* Remaining Route */}
                          <div className="ml-6 flex items-center gap-4">
                            <div className="w-0.5 h-16 bg-gradient-to-b from-blue-300 via-gray-300 to-gray-400 rounded-full"></div>
                            <div className="flex-1 opacity-50">
                              <p className="text-xs text-gray-500">Remaining Route</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Show direct line for delivered status */}
                      {selectedOrderForTracking.orderStatus?.toLowerCase() === "delivered" && (
                        <div className="ml-6 flex items-center gap-4">
                          <div className="w-0.5 h-24 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-xs text-green-600 font-semibold">Delivered successfully</p>
                          </div>
                        </div>
                      )}

                      {/* Destination */}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedOrderForTracking.orderStatus?.toLowerCase() === "delivered" 
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg" 
                            : "bg-gray-200"
                        }`}>
                          <MapPin className={selectedOrderForTracking.orderStatus?.toLowerCase() === "delivered" ? "text-white" : "text-gray-500"} size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-black ${
                              selectedOrderForTracking.orderStatus?.toLowerCase() === "delivered" 
                                ? "text-green-600" 
                                : "text-gray-700"
                            }`}>Destination</p>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              selectedOrderForTracking.orderStatus?.toLowerCase() === "delivered"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {selectedOrderForTracking.orderStatus?.toLowerCase() === "delivered" ? "Delivered" : "Pending"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 font-medium">
                            {selectedOrderForTracking.trackingInfo?.destinationLocation || 
                              selectedOrderForTracking.address || 
                              "Delivery address"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-refresh Notice */}
                {lastRefreshedAt && (
                  <div className="mt-8 pt-6 border-t-2 border-sky-100">
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
                      <p className="text-sm text-center text-gray-700 flex items-center justify-center gap-2 font-medium">
                        <Clock3 size={16} className="text-sky-600" />
                        <span>Auto-refreshes every 15 seconds</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sky-600 font-bold">
                          Last updated: {lastRefreshedAt.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;