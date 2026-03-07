
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
  Truck
} from 'lucide-react';
import { useGlobal } from '../App';
import api from '../src/services/api';
import { isValidEmail, isValidPhone, normalizePhone } from '../src/utils/validation';

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
      errors.phone = 'Enter a valid phone number (10-15 digits)';
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
                {user.phone ? `+${user.phone}` : 'No phone number saved'}
              </p>
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

            {/* Shopping Section */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-black text-gray-900">
                Your shopping
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Link
                  to="/shop"
                  className="flex items-center justify-between px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="text-sky-600" size={22} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Browse ProLatte
                      </p>
                      <p className="text-xs text-gray-500">
                        Go to the shop page
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/cart"
                  className="flex items-center justify-between px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="text-sky-600" size={22} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        View your cart
                      </p>
                      <p className="text-xs text-gray-500">
                        Review items before checkout
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/checkout"
                  className="flex items-center justify-between px-6 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="text-sky-600" size={22} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Go to checkout
                      </p>
                      <p className="text-xs text-gray-500">
                        Securely complete your order
                      </p>
                    </div>
                  </div>
                </Link>

              </div>

              {/* Live Tracking Section */}
              <div className="mt-8 border-t border-gray-100 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    Live order tracking
                  </h3>
                  <div className="flex items-center gap-2">
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
                          console.error('Failed to refresh order tracking', err);
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#0369a1] hover:opacity-80 transition"
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                  </div>
                </div>

                {!loadingOrders && !activeOrder && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">
                      No active shipment to track yet. Place your first order to see live tracking updates here.
                    </p>
                  </div>
                )}

                {activeOrder && (
                  <div className="rounded-2xl border border-[#0369a1]/15 bg-[#f8fcff] p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Tracking order</p>
                        <p className="text-sm font-black text-gray-900">
                          {activeOrder.orderNumber}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-[#0369a1]/20 text-[#0369a1]">
                        <Truck size={14} />
                        {activeOrderCurrentStep}
                      </span>
                    </div>

                    <div>
                      <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                        <div
                          className="h-full bg-[#0369a1] transition-all duration-700"
                          style={{ width: `${activeOrderProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {activeOrderProgress}% complete
                      </p>
                    </div>

                    <div className="space-y-3">
                      {activeOrderSteps.map((step: any, i: number) => (
                        <div key={step.title} className="flex items-start">
                          <div className="mt-1 mr-3">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                step.completed ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {step.title}
                            </p>
                            {step.completed && step.date ? (
                              <p className="text-xs text-gray-500">{step.date}</p>
                            ) : (
                              i > 0 && (
                                <p className="text-xs text-gray-400">Pending</p>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {lastRefreshedAt && (
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                        <Clock3 size={12} />
                        Auto-refreshes every 15s. Last updated at {lastRefreshedAt.toLocaleTimeString()}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                  Recent Orders
                </h3>

                {loadingOrders && (
                  <p className="text-sm text-gray-500">
                    Loading your orders...
                  </p>
                )}

                {!loadingOrders && orders.length === 0 && (
                  <p className="text-sm text-gray-500">
                    You don&apos;t have any orders yet.
                  </p>
                )}

                {!loadingOrders && orders.length > 0 && (
                  <div className="space-y-4">
                    {orders.map((order, idx) => (
                      <div
                        key={order._id ?? idx}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              ₹{Number(order.totalAmount ?? 0).toFixed(0)}
                            </p>

                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                order.orderStatus === "Delivered"
                                  ? "bg-green-100 text-green-600"
                                  : order.orderStatus === "Shipped"
                                  ? "bg-blue-100 text-blue-600"
                                  : order.orderStatus === "Out for Delivery"
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Tracking Timeline */}
                        {normalizeTrackingSteps(order).length > 0 && (
                          <div className="mt-4 border-t pt-4 space-y-3">
                            {normalizeTrackingSteps(order).map(
                              (step: any, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center"
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full mr-3 ${
                                      step.completed
                                        ? "bg-green-600"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {step.title}
                                    </p>
                                    {step.completed && step.date && (
                                      <p className="text-xs text-gray-400">
                                        {step.date}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  );
};

export default Profile;