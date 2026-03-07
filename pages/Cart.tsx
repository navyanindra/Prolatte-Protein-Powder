import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  MapPin
} from "lucide-react";
import { useGlobal } from "../App";
import api from "../src/services/api";
import { AddressBookItem } from "../types";
import { isValidEmail, isValidPhone, normalizePhone } from "../src/utils/validation";

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

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const normalizeAddress = (address: any): AddressBookItem => ({
  id: String(address?.id || address?._id || `${Date.now()}-${Math.random()}`),
  label: address?.label || "Address",
  fullName: address?.fullName || "",
  email: address?.email || "",
  addressLine: address?.addressLine || "",
  city: address?.city || "",
  zip: address?.zip || "",
  isDefault: Boolean(address?.isDefault)
});

const normalizeAddressBook = (addresses: any[] = []) =>
  addresses.map((item) => normalizeAddress(item));
const GST_RATE = 5;

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, user, login } =
    useGlobal();
  const navigate = useNavigate();

  const initialAddressBook = useMemo(
    () => normalizeAddressBook(user?.addresses || []),
    [user?.addresses]
  );
  const initialSelectedAddress =
    initialAddressBook.find((item) => item.isDefault) || initialAddressBook[0];

  const [isPaying, setIsPaying] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
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
  const [addressLabel, setAddressLabel] = useState("Home");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newAddressForm, setNewAddressForm] = useState<ShippingData>({
    fullName: initialSelectedAddress?.fullName || user?.name || "",
    email: initialSelectedAddress?.email || user?.email || "",
    phone: user?.phone || "",
    addressLine: initialSelectedAddress?.addressLine || "",
    city: initialSelectedAddress?.city || "",
    zip: initialSelectedAddress?.zip || ""
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
  const gstAmount = Number((subtotal * (GST_RATE / (100 + GST_RATE))).toFixed(2));
  const taxableAmount = Number((subtotal - gstAmount).toFixed(2));
  const discount = originalSubtotal - subtotal;
  const shipping = subtotal > 999 ? 0 : 50;
  const total = subtotal + shipping;

  const getFieldClass = (field: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm ${
      fieldErrors[field]
        ? "border-red-300 bg-red-50"
        : "border-gray-200 bg-white focus:border-[#0369a1]"
    }`;

  const validateShipping = (shippingData: ShippingData) => {
    const errors: Record<string, string> = {};
    if (!shippingData.fullName.trim()) errors.fullName = "Please enter full name";
    if (!shippingData.email.trim()) errors.email = "Please enter email";
    if (shippingData.email && !isValidEmail(shippingData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!shippingData.phone.trim()) errors.phone = "Please enter phone number";
    if (shippingData.phone && !isValidPhone(shippingData.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!shippingData.addressLine.trim())
      errors.addressLine = "Please enter address";
    if (!shippingData.city.trim()) errors.city = "Please enter city";
    if (!shippingData.zip.trim()) errors.zip = "Please enter pincode";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getActiveShippingData = (): ShippingData => {
    if (!isAddingNewAddress && selectedAddress) {
      return {
        fullName: selectedAddress.fullName,
        email: selectedAddress.email,
        phone: user?.phone || "",
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

  const syncUserAddresses = (updatedUser: any, fallbackShipping?: ShippingData) => {
    const nextAddressBook = normalizeAddressBook(updatedUser?.addresses || []);
    const nextDefault =
      nextAddressBook.find((item) => item.isDefault) || nextAddressBook[0];

    setAddressBook(nextAddressBook);
    setSelectedAddressId(nextDefault?.id || null);
    setIsAddingNewAddress(false);

    login({
      id: updatedUser?._id || user?.id || "",
      name: updatedUser?.name || fallbackShipping?.fullName || user?.name || "User",
      email: updatedUser?.email || fallbackShipping?.email || user?.email || "",
      role: updatedUser?.role || user?.role || "user",
      phone: updatedUser?.phone || normalizePhone(fallbackShipping?.phone || ""),
      addresses: nextAddressBook,
      avatar: user?.avatar
    });
  };

  const persistAddressToProfile = async (shippingData: ShippingData) => {
    if (!user?.email) return true;

    try {
      setIsSavingAddress(true);
      const res = await api.put("/auth/profile/address", {
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
      syncUserAddresses(updatedUser, shippingData);
      setStatusMessage({
        type: "success",
        text: "Address saved successfully."
      });

      return true;
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          (error?.response?.status
            ? `Could not save address (Error ${error.response.status}).`
            : null) ||
          "Could not save address right now. Please try again."
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
        type: "error",
        text: "Please complete required shipping fields."
      });
      return;
    }
    await persistAddressToProfile(shippingData);
  };

  const handlePayNow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setStatusMessage(null);
      const shippingData = getActiveShippingData();

      if (!validateShipping(shippingData)) {
        setStatusMessage({
          type: "error",
          text: "Please complete required shipping details before payment."
        });
        return;
      }

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
          type: "error",
          text: "Failed to load payment gateway. Please try again."
        });
        return;
      }

      setIsPaying(true);
      const paymentOrderRes = await api.post("/payments/create-order", {
        amount: total,
        currency: "INR",
        receipt: `hf_${Date.now()}`,
        notes: {
          userEmail: shippingData.email,
          paymentMethod: "razorpay"
        }
      });

      const { keyId, order: razorpayOrder } = paymentOrderRes.data;

      const openCheckout = new window.Razorpay({
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "HealthFirst Life Sciences",
        description: "Order Payment",
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
          color: "#0369a1"
        },
        handler: async (response: any) => {
          try {
            await api.post("/payments/verify", response);
            const orderCreateRes = await api.post("/orders", {
              userEmail: shippingData.email,
              phone: normalizePhone(shippingData.phone),
              items,
              address: `${shippingData.addressLine}, ${shippingData.city} - ${shippingData.zip}`,
              paymentMethod: "razorpay",
              paymentGateway: "razorpay",
              paymentStatus: "paid",
              paymentOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              paymentSignature: response.razorpay_signature
            });

            if (orderCreateRes.data.success) {
              clearCart();
              navigate(`/confirmation/${orderCreateRes.data.order._id}`);
            } else {
              setStatusMessage({
                type: "error",
                text: "Order failed after payment. Please contact support."
              });
            }
          } catch (error: any) {
            setStatusMessage({
              type: "error",
              text:
                error?.response?.data?.message ||
                "Payment succeeded but order creation failed."
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
      setStatusMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to place order"
      });
      setIsPaying(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 text-center">
          Your cart is empty
        </h1>
        <p className="text-gray-500 text-center max-w-md mb-8">
          Add ProLatte to support your daily nutrition and wellness.
        </p>
        <Link
          to="/shop"
          className="px-10 py-4 primary-bg text-white rounded-full font-bold shadow-xl hover:opacity-90 transition"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="relative flex items-center justify-end mb-8">
          <h1 className="absolute left-1/2 -translate-x-1/2 text-3xl font-black text-gray-900 text-center">
            Finalize Your Order
        </h1>
          <button
            onClick={() => navigate("/shop")}
            className="text-sm font-semibold text-[#0369a1]"
          >
            Continue shopping
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
              statusMessage.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-gray-900 inline-flex items-center">
                  <MapPin size={18} className="mr-2 text-[#0369a1]" />
                  Address
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewAddress(true);
                    setStatusMessage(null);
                    setFieldErrors({});
                  }}
                  className="text-sm font-semibold text-[#0369a1]"
                >
                  + Add new address
                </button>
              </div>

              {!isAddingNewAddress && selectedAddress ? (
                <div className="rounded-xl border border-[#0369a1]/20 bg-[#f0f9ff] px-4 py-3 mb-4">
                  <p className="font-bold text-gray-900">{selectedAddress.fullName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedAddress.addressLine}, {selectedAddress.city} -{" "}
                    {selectedAddress.zip}
                  </p>
                  <p className="text-sm text-gray-500">{selectedAddress.email}</p>
                  <p className="text-sm text-gray-500">{user?.phone ? `+${user.phone}` : "No phone saved"}</p>
                </div>
              ) : null}

              {addressBook.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addressBook.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setIsAddingNewAddress(false);
                        setFieldErrors({});
                        setStatusMessage(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedAddressId === address.id && !isAddingNewAddress
                          ? "border-[#0369a1] bg-[#f0f9ff]"
                          : "border-gray-200 bg-white hover:border-[#0369a1]/40"
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
                    </div>
                  ))}
                </div>
              )}
              {isAddingNewAddress && (
                <div className="space-y-3 mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
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
                        setNewAddressForm({
                          ...newAddressForm,
                          fullName: e.target.value
                        })
                      }
                      className={getFieldClass("fullName")}
                    />
                    <input
                      placeholder="Email"
                      value={newAddressForm.email}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, email: e.target.value })
                      }
                      className={getFieldClass("email")}
                    />
                    <input
                      placeholder="Phone Number"
                      value={newAddressForm.phone}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, phone: e.target.value })
                      }
                      className={getFieldClass("phone")}
                    />
                    <input
                      placeholder="City"
                      value={newAddressForm.city}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, city: e.target.value })
                      }
                      className={getFieldClass("city")}
                    />
                  </div>
                  <input
                    placeholder="Address Line"
                    value={newAddressForm.addressLine}
                    onChange={(e) =>
                      setNewAddressForm({
                        ...newAddressForm,
                        addressLine: e.target.value
                      })
                    }
                    className={getFieldClass("addressLine")}
                  />
                  <input
                    placeholder="Pincode"
                    value={newAddressForm.zip}
                    onChange={(e) =>
                      setNewAddressForm({ ...newAddressForm, zip: e.target.value })
                    }
                    className={getFieldClass("zip")}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress}
                      className="rounded-xl bg-[#0369a1] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {isSavingAddress ? "Saving..." : "Save address"}
                    </button>
                    {addressBook.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewAddress(false);
                          setFieldErrors({});
                        }}
                        className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!selectedAddress && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No address selected. Please add one here or manage addresses in profile.
                </div>
              )}
            </section>

            <section className="space-y-6">
            {cart.map((item) => {
              const discountedPrice = getDiscountedPrice(item);

              return (
                <div
                  key={`${item.id}-${item.selectedFlavor}`}
                  className="bg-white rounded-3xl p-6 shadow-sm border flex flex-col sm:flex-row items-center gap-8 hover:shadow-lg transition"
                >
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow space-y-2 text-center sm:text-left">
                      <h3 className="text-xl font-black text-gray-900">{item.name}</h3>
                    {item.selectedFlavor && (
                      <p className="text-xs text-gray-500">
                        Flavor: {item.selectedFlavor}
                      </p>
                    )}
                    <div>
                      {item.discountPercentage > 0 && (
                        <span className="text-sm line-through text-gray-400 mr-2">
                          Rs {item.price}
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900">
                        Rs {discountedPrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:items-end space-y-4">
                    <div className="flex items-center border rounded-xl p-1">
                      <button
                        onClick={() =>
                            updateQuantity(item.id, item.selectedFlavor, -1)
                        }
                        className="p-1 text-gray-400 hover:text-gray-900"
                      >
                        <Minus size={16} />
                      </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() =>
                            updateQuantity(item.id, item.selectedFlavor, 1)
                        }
                        className="p-1 text-gray-400 hover:text-gray-900"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-black text-gray-900">
                        Rs {(discountedPrice * item.quantity).toFixed(0)}
                      </span>
                      <button
                          onClick={() => removeFromCart(item.id, item.selectedFlavor)}
                        className="p-2 text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </section>
          </div>

          <div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border sticky top-24">
              <h2 className="text-2xl font-black mb-6 pb-4 border-b">Order Summary</h2>

              <div className="space-y-4 mb-6 text-base">
                <div className="flex justify-between text-gray-700 font-medium">
                  <span className="text-base">Item total</span>
                  <span className="text-lg font-semibold text-gray-900">Rs {subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="text-sm">Taxable value</span>
                  <span className="text-sm font-medium">Rs {taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="text-sm">GST (5%, included)</span>
                  <span className="text-sm font-medium">Rs {gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span className="text-base">Discount</span>
                  <span className="text-lg">- Rs {discount.toFixed(0)}</span>
              </div>
                <div className="flex justify-between text-gray-700 font-medium">
                  <span className="text-base">Delivery fee</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {shipping === 0 ? "FREE" : `Rs ${shipping.toFixed(0)}`}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center text-[#0369a1]">
                  <span className="text-xl font-black">Order Total</span>
                  <span className="text-3xl font-black">Rs {Math.max(0, total).toFixed(0)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isPaying || isSavingAddress || cart.length === 0}
                className="w-full primary-bg text-white py-4 rounded-2xl font-black text-lg disabled:opacity-60 transition flex items-center justify-center group"
              >
                {isPaying ? "Opening payment..." : `Pay Rs ${total.toFixed(0)}`}
                <ArrowRight
                  size={20}
                  className="ml-2 group-hover:translate-x-1 transition"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Cart;