import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Smartphone } from 'lucide-react';
import { useGlobal } from '../App';
import api from '../src/services/api';
import { AddressBookItem } from '../types';
import { isValidEmail, isValidPhone, normalizePhone } from '../src/utils/validation';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

type ShippingData = {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  zip: string;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'upi', label: 'UPI', icon: <Smartphone className="inline mr-2" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="inline mr-2" /> },
  { value: 'netbanking', label: 'Net Banking', icon: <CreditCard className="inline mr-2" /> },
  { value: 'wallet', label: 'Wallet', icon: <Smartphone className="inline mr-2" /> }
];

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const normalizeAddress = (address: any): AddressBookItem => ({
  id: String(address?.id || address?._id || `${Date.now()}-${Math.random()}`),
  label: address?.label || 'Address',
  fullName: address?.fullName || '',
  email: address?.email || '',
  addressLine: address?.addressLine || '',
  city: address?.city || '',
  zip: address?.zip || '',
  isDefault: Boolean(address?.isDefault)
});

const normalizeAddressBook = (addresses: any[] = []) =>
  addresses.map((item) => normalizeAddress(item));

const Checkout: React.FC = () => {
  const { cart, clearCart, user, login } = useGlobal();
  const navigate = useNavigate();

  const initialAddressBook = useMemo(
    () => normalizeAddressBook(user?.addresses || []),
    [user?.addresses]
  );
  const initialSelectedAddress =
    initialAddressBook.find((item) => item.isDefault) || initialAddressBook[0];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isPaying, setIsPaying] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [addressBook, setAddressBook] = useState<AddressBookItem[]>(
    initialAddressBook
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialSelectedAddress?.id || null
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(
    initialAddressBook.length === 0
  );
  const [addressLabel, setAddressLabel] = useState('Home');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newAddressForm, setNewAddressForm] = useState<ShippingData>({
    fullName: initialSelectedAddress?.fullName || user?.name || '',
    email: initialSelectedAddress?.email || user?.email || '',
    phone: user?.phone || '',
    addressLine: initialSelectedAddress?.addressLine || '',
    city: initialSelectedAddress?.city || '',
    zip: initialSelectedAddress?.zip || ''
  });

  const selectedAddress = addressBook.find(
    (item) => item.id === selectedAddressId
  );

  const getDiscountedPrice = (item: any) => {
    if (item.discountPercentage && item.discountPercentage > 0) {
      return Math.round(
        item.price - (item.price * item.discountPercentage) / 100
      );
    }
    return item.price;
  };

  const originalSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const subtotal = cart.reduce(
    (sum, item) => sum + getDiscountedPrice(item) * item.quantity,
    0
  );
  const discount = originalSubtotal - subtotal;
  const shipping = subtotal > 999 ? 0 : 50;
  const total = subtotal + shipping;

  const getFieldClass = (field: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm ${
      fieldErrors[field]
        ? 'border-red-300 bg-red-50'
        : 'border-gray-200 bg-white focus:border-[#0369a1]'
    }`;

  const validateShipping = (shippingData: ShippingData) => {
    const errors: Record<string, string> = {};
    if (!shippingData.fullName.trim()) errors.fullName = 'Please enter full name';
    if (!shippingData.email.trim()) errors.email = 'Please enter email';
    if (shippingData.email && !isValidEmail(shippingData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!shippingData.phone.trim()) errors.phone = 'Please enter phone number';
    if (shippingData.phone && !isValidPhone(shippingData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!shippingData.addressLine.trim()) errors.addressLine = 'Please enter address';
    if (!shippingData.city.trim()) errors.city = 'Please enter city';
    if (!shippingData.zip.trim()) errors.zip = 'Please enter pincode';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getActiveShippingData = (): ShippingData => {
    if (!isAddingNewAddress && selectedAddress) {
      return {
        fullName: selectedAddress.fullName,
        email: selectedAddress.email,
        phone: user?.phone || '',
        addressLine: selectedAddress.addressLine,
        city: selectedAddress.city,
        zip: selectedAddress.zip
      };
    }

    return {
      fullName: newAddressForm.fullName.trim(),
      email: newAddressForm.email.trim(),
      phone: newAddressForm.phone.trim(),
      addressLine: newAddressForm.addressLine.trim(),
      city: newAddressForm.city.trim(),
      zip: newAddressForm.zip.trim()
    };
  };

  const persistAddressToProfile = async (shippingData: ShippingData) => {
    if (!user?.email) return true;

    try {
      setIsSavingAddress(true);
      const res = await api.put('/auth/profile/address', {
        userEmail: user.email,
        label: addressLabel,
        fullName: shippingData.fullName,
        email: shippingData.email,
        phone: normalizePhone(shippingData.phone),
        addressLine: shippingData.addressLine,
        city: shippingData.city,
        zip: shippingData.zip,
        makeDefault: true
      });

      const updatedUser = res.data?.user;
      const nextAddressBook = normalizeAddressBook(updatedUser?.addresses || []);
      const nextDefault =
        nextAddressBook.find((item) => item.isDefault) || nextAddressBook[0];

      setAddressBook(nextAddressBook);
      setSelectedAddressId(nextDefault?.id || null);
      setIsAddingNewAddress(false);
      setStatusMessage({
        type: 'success',
        text: 'Address saved successfully.'
      });

      login({
        id: updatedUser?._id || user.id,
        name: updatedUser?.name || shippingData.fullName || user.name,
        email: updatedUser?.email || shippingData.email || user.email,
        role: updatedUser?.role || user.role,
        phone: updatedUser?.phone || normalizePhone(shippingData.phone),
        addresses: nextAddressBook,
        avatar: user.avatar
      });

      return true;
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          (error?.response?.status
            ? `Could not save address (Error ${error.response.status}).`
            : null) ||
          'Could not save address right now. Please try again.'
      });
      return false;
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveAddress = async () => {
    setStatusMessage(null);
    const shippingData = getActiveShippingData();
    if (!validateShipping(shippingData)) {
      setStatusMessage({
        type: 'error',
        text: 'Please complete required shipping fields.'
      });
      return;
    }
    await persistAddressToProfile(shippingData);
  };

  const handlePayAndPlaceOrder = async () => {
    try {
      setStatusMessage(null);
      if (cart.length === 0) {
        setStatusMessage({ type: 'error', text: 'Cart is empty.' });
        return;
      }

      const shippingData = getActiveShippingData();
      if (!validateShipping(shippingData)) {
        setStatusMessage({
          type: 'error',
          text: 'Please complete required shipping fields before payment.'
        });
        return;
      }

      // Save new address automatically before opening payment.
      if (isAddingNewAddress) {
        const saved = await persistAddressToProfile(shippingData);
        if (!saved) return;
      }

      const items = cart.map((item: any) => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setStatusMessage({
          type: 'error',
          text: 'Failed to load payment gateway. Please try again.'
        });
        return;
      }

      setIsPaying(true);
      const paymentOrderRes = await api.post('/payments/create-order', {
        amount: total,
        currency: 'INR',
        receipt: `hf_${Date.now()}`,
        notes: {
          userEmail: shippingData.email,
          paymentMethod
        }
      });

      const { keyId, order: razorpayOrder } = paymentOrderRes.data;

      const openCheckout = new window.Razorpay({
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'HealthFirst Life Sciences',
        description: `Order Payment (${paymentMethod.toUpperCase()})`,
        order_id: razorpayOrder.id,
        prefill: {
          name: shippingData.fullName,
          email: shippingData.email,
          contact: normalizePhone(shippingData.phone)
        },
        notes: {
          address: `${shippingData.addressLine}, ${shippingData.city} - ${shippingData.zip}`,
          phone: normalizePhone(shippingData.phone)
        },
        theme: {
          color: '#0369a1'
        },
        config: {
          display: {
            blocks: {
              all: {
                name: 'All Payment Options',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'wallet' },
                  { method: 'netbanking' }
                ]
              }
            },
            sequence: ['block.all'],
            preferences: {
              show_default_blocks: false
            }
          }
        },
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', response);
            const orderCreateRes = await api.post('/orders', {
              userEmail: shippingData.email,
              phone: normalizePhone(shippingData.phone),
              items,
              address: `${shippingData.addressLine}, ${shippingData.city} - ${shippingData.zip}`,
              paymentMethod,
              paymentGateway: 'razorpay',
              paymentStatus: 'paid',
              paymentOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              paymentSignature: response.razorpay_signature
            });

            if (orderCreateRes.data.success) {
              clearCart();
              navigate(`/confirmation/${orderCreateRes.data.order._id}`);
            } else {
              setStatusMessage({
                type: 'error',
                text: 'Order failed after payment. Please contact support.'
              });
            }
          } catch (error: any) {
            console.error(error?.response?.data || error);
            setStatusMessage({
              type: 'error',
              text:
                error?.response?.data?.message ||
                'Payment succeeded but order creation failed.'
            });
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false)
        }
      });

      openCheckout.open();
    } catch (error: any) {
      console.error(error?.response?.data || error);
      setStatusMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to place order'
      });
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 font-semibold hover:text-gray-900"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to cart
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Secure checkout</h1>
          <div className="w-10" />
        </div>

        {statusMessage && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900 inline-flex items-center">
                  <MapPin size={16} className="mr-2 text-[#0369a1]" />
                  Address
                </h2>
                {addressBook.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewAddress(true);
                      setSelectedAddressId(null);
                      setStatusMessage(null);
                      setFieldErrors({});
                    }}
                    className="text-sm font-semibold text-[#0369a1]"
                  >
                    + Add new address
                  </button>
                )}
              </div>

              {!isAddingNewAddress && selectedAddress ? (
                <div className="rounded-xl border border-[#0369a1]/20 bg-[#f0f9ff] px-4 py-3">
                  <p className="font-bold text-gray-900">{selectedAddress.fullName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedAddress.addressLine}, {selectedAddress.city} - {selectedAddress.zip}
                  </p>
                  <p className="text-sm text-gray-500">{selectedAddress.email}</p>
                  <p className="text-sm text-gray-500">{user?.phone ? `+${user.phone}` : 'No phone saved'}</p>
                </div>
              ) : null}

              {addressBook.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {addressBook.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setIsAddingNewAddress(false);
                        setFieldErrors({});
                        setStatusMessage(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedAddressId === address.id && !isAddingNewAddress
                          ? 'border-[#0369a1] bg-[#f0f9ff]'
                          : 'border-gray-200 bg-white hover:border-[#0369a1]/40'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        {address.fullName}
                        {address.isDefault ? (
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                            Default
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {address.addressLine}, {address.city} - {address.zip}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {isAddingNewAddress && (
                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Address label (Home, Work)"
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    />
              <input
                placeholder="Full Name"
                      value={newAddressForm.fullName}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, fullName: e.target.value })
                      }
                      className={getFieldClass('fullName')}
                    />
              <input
                placeholder="Email"
                      value={newAddressForm.email}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, email: e.target.value })
                      }
                      className={getFieldClass('email')}
                    />
              <input
                placeholder="Phone Number"
                      value={newAddressForm.phone}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, phone: e.target.value })
                      }
                      className={getFieldClass('phone')}
                    />
              <input
                placeholder="City"
                      value={newAddressForm.city}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, city: e.target.value })
                      }
                      className={getFieldClass('city')}
                    />
                  </div>
                  <input
                    placeholder="Address Line"
                    value={newAddressForm.addressLine}
                    onChange={(e) =>
                      setNewAddressForm({ ...newAddressForm, addressLine: e.target.value })
                    }
                    className={getFieldClass('addressLine')}
                  />
              <input
                placeholder="Pincode"
                    value={newAddressForm.zip}
                    onChange={(e) =>
                      setNewAddressForm({ ...newAddressForm, zip: e.target.value })
                    }
                    className={getFieldClass('zip')}
                  />

                  {Object.keys(fieldErrors).length > 0 && (
                    <p className="text-xs text-red-600">
                      Please fix the highlighted fields.
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress}
                      className="rounded-xl bg-[#0369a1] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {isSavingAddress ? 'Saving...' : 'Save address'}
                    </button>
                    {addressBook.length > 0 && (
              <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(false)}
                        className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
                      >
                        Cancel
              </button>
                    )}
                  </div>
            </div>
          )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Your Cart</h2>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="text-sm font-semibold text-[#0369a1]"
                >
                  Edit cart
              </button>
            </div>

              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                const discountedPrice = getDiscountedPrice(item);
                return (
                      <div
                        key={`${item.id}-${item.selectedFlavor}`}
                        className="rounded-xl border border-gray-200 p-4 flex items-center gap-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover bg-gray-50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                            {item.selectedFlavor ? ` | ${item.selectedFlavor}` : ''}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-gray-900">
                          Rs {(discountedPrice * item.quantity).toFixed(0)}
                        </p>
                  </div>
                );
              })}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 lg:sticky lg:top-24">
              <h2 className="text-lg font-black text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Item total</span>
                <span>Rs {subtotal.toFixed(0)}</span>
              </div>
                <div className="flex justify-between text-green-600 font-semibold">
                <span>Discount</span>
                <span>- Rs {discount.toFixed(0)}</span>
              </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>{shipping === 0 ? 'FREE' : `Rs ${shipping.toFixed(0)}`}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-black text-base text-[#0369a1]">
                  <span>Order Total</span>
                  <span>Rs {total.toFixed(0)}</span>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sm font-bold text-gray-800 mb-2">Payment Details</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        paymentMethod === option.value
                          ? 'border-[#0369a1] bg-[#f0f9ff] text-[#0369a1]'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Test mode: use UPI <strong>success@razorpay</strong> or domestic card (e.g. 5267 3181 8797 5449). If you see &quot;International is not accepted&quot;, use UPI or enable international in Razorpay Dashboard.
              </p>
              </div>

              <button
                type="button"
                onClick={handlePayAndPlaceOrder}
                disabled={isPaying || isSavingAddress || cart.length === 0}
                className="w-full rounded-xl bg-[#0369a1] text-white py-3.5 text-sm font-black disabled:opacity-60"
              >
                {isPaying ? 'Opening payment...' : `Pay Rs ${total.toFixed(0)}`}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;