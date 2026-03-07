import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  RefreshCcw,
  Save,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Plus
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import api from "../src/services/api";

type TabId =
  | "overview"
  | "orders"
  | "products"
  | "customers"
  | "payments"
  | "analytics"
  | "system";

interface AdminSummary {
  totalRevenue: number;
  ordersToday: number;
  customers: number;
  totalOrders: number;
  paidOrders: number;
  pendingPayments: number;
  lowStockCount: number;
}

const emptySummary: AdminSummary = {
  totalRevenue: 0,
  ordersToday: 0,
  customers: 0,
  totalOrders: 0,
  paidOrders: 0,
  pendingPayments: 0,
  lowStockCount: 0
};

const defaultProductForm = {
  name: "",
  price: 0,
  discountPercentage: 0,
  stock: 0,
  sku: "",
  weight: "",
  image: "",
  description: "",
  isActive: true
};

type ConfirmModalData = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmAction: () => void;
  type: "danger" | "warning" | "info";
};

const COLORS = ["#0369a1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [summary, setSummary] = useState<AdminSummary>(emptySummary);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [system, setSystem] = useState<any>({ db: {}, auditLogs: [] });
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);
  const [pendingOrderUpdate, setPendingOrderUpdate] = useState<{
    orderId: string;
    field: "orderStatus" | "paymentStatus";
    value: string;
  } | null>(null);
  const [pendingCustomerUpdate, setPendingCustomerUpdate] = useState<{
    customerId: string;
    role: string;
  } | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerEditDraft, setCustomerEditDraft] = useState({ name: "", phone: "" });
  const [customerEditErrors, setCustomerEditErrors] = useState<Record<string, string>>({});
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);

  // Location update modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationUpdateData, setLocationUpdateData] = useState<{
    orderId: string;
    status: string;
    orderNumber: string;
    currentLocation: string;
  } | null>(null);

  const fetchDashboard = async () => {
    const res = await api.get("/admin/dashboard");
    setSummary({ ...emptySummary, ...(res.data.summary || {}) });
    setRecentOrders(res.data.recentOrders || []);
  };

  const fetchOrders = async () => {
    const res = await api.get("/admin/orders");
    setOrders(res.data || []);
  };

  const fetchProducts = async () => {
    const res = await api.get("/admin/products");
    setProducts(res.data || []);
  };

  const fetchCustomers = async () => {
    const res = await api.get("/admin/customers");
    setCustomers(res.data || []);
  };

  const fetchPayments = async () => {
    const res = await api.get("/admin/payments");
    setPayments(res.data.payments || []);
    setPaymentSummary(res.data.summary || []);
  };

  const fetchAnalytics = async () => {
    const res = await api.get("/admin/analytics");
    setAnalytics(res.data || {});
  };

  const fetchSystem = async () => {
    const res = await api.get("/admin/system");
    setSystem(res.data || { db: {}, auditLogs: [] });
  };

  const loadTabData = async (tab: TabId) => {
    setLoading(true);
    setError("");
    try {
      if (tab === "overview") {
        await fetchDashboard();
        // Load analytics and payments for overview tab since it displays charts
        await Promise.all([fetchAnalytics(), fetchPayments()]);
      }
      if (tab === "orders") await fetchOrders();
      if (tab === "products") await fetchProducts();
      if (tab === "customers") await fetchCustomers();
      if (tab === "payments") await fetchPayments();
      if (tab === "analytics") await fetchAnalytics();
      if (tab === "system") await fetchSystem();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData("overview");
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const topMetrics = useMemo(() => {
    const revenueChange = 12.5;
    const ordersChange = -3.2;
    const customersChange = 8.1;
    const lowStockChange = -15.0;

    return [
      {
        label: "Total Revenue",
        value: `Rs ${summary.totalRevenue.toFixed(0)}`,
        change: revenueChange,
        icon: DollarSign,
        color: "sky"
      },
      {
        label: "Orders Today",
        value: String(summary.ordersToday),
        change: ordersChange,
        icon: ShoppingBag,
        color: "emerald"
      },
      {
        label: "Total Customers",
        value: String(summary.customers),
        change: customersChange,
        icon: Users,
        color: "violet"
      },
      {
        label: "Low Stock Items",
        value: String(summary.lowStockCount),
        change: lowStockChange,
        icon: Package,
        color: "amber"
      }
    ];
  }, [summary]);

  const showConfirmModal = (data: ConfirmModalData) => {
    setConfirmModal(data);
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
    setPendingOrderUpdate(null);
    setPendingCustomerUpdate(null);
  };

  // Helper function to format status display
  const formatStatusDisplay = (status: string) => {
    if (!status) return "Placed";
    
    // Convert underscores to spaces and capitalize each word
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleOrderStatusChange = (
    orderId: string,
    field: "orderStatus" | "paymentStatus",
    value: string
  ) => {
    const order = orders.find((o) => o._id === orderId);
    
    // If changing order status to shipped or out_for_delivery, show location modal
    // Placed and Confirmed use default location, no need for modal
    if (field === "orderStatus" && ["shipped", "out_for_delivery"].includes(value.toLowerCase())) {
      setLocationUpdateData({
        orderId,
        status: value,
        orderNumber: order?.orderNumber || "",
        currentLocation: ""
      });
      setIsLocationModalOpen(true);
      return;
    }

    // For other status changes or payment status, use regular confirm modal
    setPendingOrderUpdate({ orderId, field, value });
    const fieldLabel = field === "orderStatus" ? "Order Status" : "Payment Status";

    showConfirmModal({
      title: `Update ${fieldLabel}`,
      message: `Are you sure you want to change ${fieldLabel} for order ${order?.orderNumber} to "${value}"?`,
      confirmText: "Update",
      cancelText: "Cancel",
      type: "warning",
      confirmAction: async () => {
        try {
          const order = orders.find((o) => o._id === orderId);
          const orderStatus =
            field === "orderStatus" ? value : order?.orderStatus || "placed";
          const paymentStatus =
            field === "paymentStatus" ? value : order?.paymentStatus || "pending";

      await api.patch(`/admin/orders/${orderId}`, { orderStatus, paymentStatus });
      await fetchOrders();
      await fetchDashboard();
          setSuccessMessage("Order updated successfully");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update order");
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleLocationUpdate = async () => {
    if (!locationUpdateData) return;
    
    if (!locationUpdateData.currentLocation.trim()) {
      setError("Please enter the current location");
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/admin/orders/${locationUpdateData.orderId}/status`, {
        orderStatus: locationUpdateData.status,
        currentLocation: locationUpdateData.currentLocation
      });
      
      await fetchOrders();
      await fetchDashboard();
      setSuccessMessage(`Order status updated to ${locationUpdateData.status}`);
      setIsLocationModalOpen(false);
      setLocationUpdateData(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRoleChange = (customerId: string, role: string) => {
    const customer = customers.find((c) => c._id === customerId);
    setPendingCustomerUpdate({ customerId, role });

    showConfirmModal({
      title: "Change Customer Role",
      message: `Are you sure you want to change ${customer?.email}'s role to "${role}"? This will affect their access permissions.`,
      confirmText: "Change Role",
      cancelText: "Cancel",
      type: "warning",
      confirmAction: async () => {
    try {
      await api.patch(`/admin/customers/${customerId}/role`, { role });
      await fetchCustomers();
          setSuccessMessage("Customer role updated successfully");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update customer role");
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const startEditingCustomer = () => {
    if (!selectedCustomer) return;
    setCustomerEditDraft({
      name: selectedCustomer.name || "",
      phone: selectedCustomer.phone || ""
    });
    setCustomerEditErrors({});
    setIsEditingCustomer(true);
  };

  const cancelEditingCustomer = () => {
    setIsEditingCustomer(false);
    setCustomerEditErrors({});
  };

  const validateCustomerEdit = () => {
    const errors: Record<string, string> = {};
    if (!customerEditDraft.name.trim()) {
      errors.name = "Name is required";
    }
    if (!customerEditDraft.phone.trim()) {
      errors.phone = "Phone number is required";
    }
    if (customerEditDraft.phone && !/^\d{10}$/.test(customerEditDraft.phone.replace(/\D/g, ""))) {
      errors.phone = "Enter a valid 10-digit phone number";
    }
    setCustomerEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomerInfo = async () => {
    if (!validateCustomerEdit() || !selectedCustomer) return;

    try {
      setIsCustomerSubmitting(true);
      await api.patch(`/admin/customers/${selectedCustomer._id}`, {
        name: customerEditDraft.name.trim(),
        phone: customerEditDraft.phone.replace(/\D/g, "")
      });

      await fetchCustomers();
      
      setSelectedCustomer({
        ...selectedCustomer,
        name: customerEditDraft.name.trim(),
        phone: customerEditDraft.phone.replace(/\D/g, "")
      });

      setIsEditingCustomer(false);
      setSuccessMessage("Customer information updated successfully");
    } catch (err: any) {
      setCustomerEditErrors({
        _general: err?.response?.data?.message || "Failed to update customer information"
      });
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.sku || !productForm.weight) {
      setError("Please fill in all required fields (Name, SKU, Weight)");
      return;
    }

    const isEditing = editingProductId !== null;
    console.log("handleSaveProduct - isEditing:", isEditing, "editingProductId:", editingProductId);

    showConfirmModal({
      title: isEditing ? "Update Product" : "Add New Product",
      message: isEditing 
        ? `Update "${productForm.name}" with ${productForm.stock} units at Rs ${productForm.price}?`
        : `Add "${productForm.name}" to inventory with ${productForm.stock} units at Rs ${productForm.price}?`,
      confirmText: isEditing ? "Update Product" : "Add Product",
      cancelText: "Cancel",
      type: "info",
      confirmAction: async () => {
        try {
          console.log("Making API call - isEditing:", isEditing);
          if (isEditing) {
            console.log("PUT request to:", `/admin/products/${editingProductId}`, "with data:", productForm);
            const response = await api.put(`/admin/products/${editingProductId}`, productForm);
            console.log("Update response:", response.data);
            setSuccessMessage("Product updated successfully");
          } else {
            console.log("POST request with data:", productForm);
            await api.post("/admin/products", productForm);
            setSuccessMessage("Product added successfully");
          }
          
          setProductForm(defaultProductForm);
          setIsProductModalOpen(false);
          setEditingProductId(null);
          await fetchProducts();
          await fetchDashboard();
        } catch (err: any) {
          console.error("Error updating/creating product:", err);
          console.error("Error response:", err?.response?.data);
          setError(err?.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const revenueChartData = useMemo(() => {
    return (analytics.revenueByDay || []).map((row: any) => ({
      date: `${row._id?.day}/${row._id?.month}`,
      revenue: row.revenue || 0,
      orders: row.orders || 0
    }));
  }, [analytics]);

  const paymentDistribution = useMemo(() => {
    return paymentSummary.map((s) => ({
      name: s._id || "unknown",
      value: s.count || 0
    }));
  }, [paymentSummary]);

  const topProductsData = useMemo(() => {
    return (analytics.topProducts || []).slice(0, 5).map((item: any) => ({
      name: item._id?.length > 20 ? item._id.substring(0, 20) + "..." : item._id,
      quantity: item.quantity || 0
    }));
  }, [analytics]);

  const renderContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topMetrics.map((item) => (
              <div
                key={item.label}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-${item.color}-50 text-${item.color}-600`}
                  >
                    <item.icon size={24} />
                  </div>
                  <div
                    className={`flex items-center text-sm font-semibold ${
                      item.change >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {item.change >= 0 ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : (
                      <TrendingDown size={16} className="mr-1" />
                    )}
                    {Math.abs(item.change)}%
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                <p className="text-3xl font-black text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4">Revenue Trend</h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0369a1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0369a1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0369a1"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No revenue data available</p>
              )}
            </div>

            {/* Payment Distribution */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                Payment Status Distribution
              </h3>
              {paymentDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No payment data available</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-lg font-black text-gray-900">Recent Orders</h3>
              <button
                onClick={() => loadTabData("overview")}
                className="px-4 py-2 rounded-lg bg-sky-50 text-sky-700 font-semibold text-sm hover:bg-sky-100 transition flex items-center gap-2"
              >
                <RefreshCcw size={14} /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {o.orderNumber || o.id}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{o.customerName}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        Rs {Number(o.total || 0).toFixed(0)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            o.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : o.paymentStatus === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
                          {o.orderStatus || "placed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "orders") {
      const filteredOrders = orders.filter((o) => {
        const matchesSearch =
          o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.phone?.includes(searchQuery);
        
        const matchesFilter =
          orderFilter === "all" ||
          (orderFilter === "pending" && o.paymentStatus === "pending") ||
          (orderFilter === "paid" && o.paymentStatus === "paid") ||
          (orderFilter === "delivered" && o.orderStatus === "delivered");
        
        return matchesSearch && matchesFilter;
      });

      return (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by order number, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-200 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="delivered">Delivered</option>
              </select>
              <button
                onClick={() => fetchOrders()}
                className="px-5 py-3 rounded-lg bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100 transition flex items-center gap-2"
              >
                <RefreshCcw size={16} /> Refresh
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">Order Management</h3>
                <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                  {filteredOrders.length} orders
                </span>
              </div>
          </div>
          <div className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div
                    key={o._id}
                    className="p-6 hover:bg-gray-50 transition grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    <div className="md:col-span-3">
                      <p className="font-bold text-gray-900 text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{o.userEmail}</p>
                      {o.phone ? <p className="text-xs text-gray-500">+{o.phone}</p> : null}
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs text-sky-600 hover:text-sky-700 font-semibold mt-2"
                      >
                        View Details →
                      </button>
                    </div>
                <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="font-bold text-gray-900">
                        Rs {Number(o.totalAmount || 0).toFixed(0)}
                      </p>
                </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">Order Status</label>
                <select
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  value={o.orderStatus || "placed"}
                        onChange={(e) =>
                          handleOrderStatusChange(o._id, "orderStatus", e.target.value)
                        }
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">Payment Status</label>
                <select
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  value={o.paymentStatus || "pending"}
                        onChange={(e) =>
                          handleOrderStatusChange(o._id, "paymentStatus", e.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                </select>
              </div>
                    <div className="md:col-span-1 text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "products") {
      const filteredProducts = products.filter((p) => {
        const matchesSearch =
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter =
          productFilter === "all" ||
          (productFilter === "low_stock" && p.stock < 20) ||
          (productFilter === "in_stock" && p.stock >= 20);
        
        return matchesSearch && matchesFilter;
      });

      return (
        <div className="space-y-6">
          {/* Header with Search and Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900">Product Inventory</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your product catalog</p>
            </div>
            <button
              onClick={() => {
                setProductForm(defaultProductForm);
                setEditingProductId(null);
                setIsProductModalOpen(true);
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 text-white font-bold hover:from-sky-700 hover:to-sky-800 transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
            >
              <Plus size={18} /> Add Product
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-200 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              >
                <option value="all">All Products</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock (&lt;20)</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">No products found</p>
                </div>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition group"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-gray-300" />
                      </div>
                    )}
                    {p.stock < 20 && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Low Stock
                      </div>
                    )}
                    {p.discountPercentage > 0 && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                        -{p.discountPercentage}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {p.sku} • {p.weight}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                        <p className="text-xs text-gray-500 mb-1">Stock</p>
                        <p
                          className={`text-lg font-black ${
                            p.stock < 20 ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {p.stock}
                        </p>
                  </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Price</p>
                        <p className="text-lg font-black text-gray-900">
                          Rs {Number(p.price).toFixed(0)}
                        </p>
                  </div>
                </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2">
                        {p.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setProductForm({
                            name: p.name || "",
                            price: p.price || 0,
                            discountPercentage: p.discountPercentage || 0,
                            stock: p.stock || 0,
                            sku: p.sku || "",
                            weight: p.weight || "",
                            image: p.image || "",
                            description: p.description || "",
                            isActive: p.isActive !== false
                          });
                          setEditingProductId(p._id);
                          setIsProductModalOpen(true);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-sky-50 text-sky-700 font-semibold text-sm hover:bg-sky-100 transition flex items-center justify-center gap-2"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          showConfirmModal({
                            title: "Delete Product",
                            message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
                            confirmText: "Delete",
                            cancelText: "Cancel",
                            type: "danger",
                            confirmAction: async () => {
                              setSuccessMessage("Delete functionality will be implemented");
                              closeConfirmModal();
                            }
                          });
                        }}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
            </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "customers") {
      const filteredCustomers = customers.filter((c) =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
      );

      return (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
                </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">No customers found</p>
                </div>
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <div
                  key={c._id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-lg">
                        {(c.name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{c.name || "Unnamed"}</h3>
                        <p className="text-sm text-gray-500">{c.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition"
                    >
                      View
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="bg-gradient-to-br from-emerald-50 to-transparent p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                      <p className="text-2xl font-black text-emerald-600">
                        {c.totalOrders || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-50 to-transparent p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                      <p className="text-2xl font-black text-violet-600">
                        Rs {Number(c.totalSpent || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Role and Contact */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block">
                        Role
                      </label>
                <select
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  value={c.role}
                        onChange={(e) => handleCustomerRoleChange(c._id, e.target.value)}
                >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                </select>
              </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold">Phone:</span>
                      <span>{c.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "payments") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentSummary.map((s) => (
              <div
                key={s._id || "unknown"}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition"
              >
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                  {s._id || "unknown"}
                </p>
                <p className="text-2xl font-black text-gray-900 mb-1">{s.count}</p>
                <p className="text-sm text-gray-600">Rs {Number(s.total || 0).toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-lg font-black text-gray-900">Payment Tracker</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{p.orderNumber}</td>
                      <td className="px-6 py-4 text-gray-700">{p.userEmail}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        Rs {Number(p.totalAmount || 0).toFixed(0)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{p.paymentGateway || "none"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            p.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.paymentStatus === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.paymentStatus || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "analytics") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4">
                Revenue Breakdown (Last 30 Days)
              </h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0369a1" name="Revenue (Rs)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No revenue data available</p>
              )}
                </div>

            {/* Top Products */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4">Top Selling Products</h3>
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#10b981" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No product data available</p>
              )}
            </div>
          </div>

          {/* Detailed Revenue List */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4">Daily Revenue Details</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(analytics.revenueByDay || []).map((row: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <span className="text-sm font-semibold text-gray-700">
                    {`${row._id?.day}/${row._id?.month}/${row._id?.year}`}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{row.orders} orders</span>
                    <span className="font-bold text-sky-700">
                      Rs {Number(row.revenue || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users size={28} />
          </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">Total Users</p>
                <p className="text-4xl font-black">{system.db?.users || 0}</p>
          </div>
          </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Registered accounts in database</p>
        </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Package size={28} />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">Total Products</p>
                <p className="text-4xl font-black">{system.db?.products || 0}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Products in inventory catalog</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShoppingBag size={28} />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">Total Orders</p>
                <p className="text-4xl font-black">{system.db?.orders || 0}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Completed & pending orders</p>
            </div>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">System Status</h3>
                <p className="text-sm text-gray-600">All services operational</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Database</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">API Server</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  Running
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Payment Gateway</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-sky-100 rounded-xl">
                <BarChart3 size={24} className="text-sky-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">Activity Summary</h3>
                <p className="text-sm text-gray-600">Last 24 hours</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-sky-50 to-transparent rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Admin Actions</span>
                <span className="text-lg font-black text-sky-600">
                  {(system.auditLogs || []).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg">
                <span className="text-sm font-semibold text-gray-700">New Orders</span>
                <span className="text-lg font-black text-emerald-600">{summary.ordersToday}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-transparent rounded-lg">
                <span className="text-sm font-semibold text-gray-700">New Customers</span>
                <span className="text-lg font-black text-violet-600">
                  {Math.floor(summary.customers * 0.1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Audit Log */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-100 rounded-xl">
                  <Shield size={20} className="text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Admin Audit Log</h3>
                  <p className="text-xs text-gray-600">Track all administrative actions</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                {(system.auditLogs || []).length} entries
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(system.auditLogs || []).length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">No audit log entries yet</p>
              </div>
            ) : (
              (system.auditLogs || []).map((log: any, index: number) => {
                const getActionLabel = (action: string) => {
                  const labels: Record<string, string> = {
                    UPDATE_ORDER: "Order Updated",
                    CREATE_PRODUCT: "Product Created",
                    UPDATE_PRODUCT: "Product Modified",
                    UPDATE_USER_ROLE: "User Role Changed",
                    CREATE_ORDER: "Order Created"
                  };
                  return labels[action] || action.replace(/_/g, " ");
                };

                const getActionColor = (action: string) => {
                  if (action.includes("CREATE")) return "bg-emerald-100 text-emerald-700";
                  if (action.includes("UPDATE")) return "bg-sky-100 text-sky-700";
                  if (action.includes("DELETE")) return "bg-red-100 text-red-700";
                  return "bg-gray-100 text-gray-700";
                };

                const getEntityIcon = (entity: string) => {
                  if (entity === "order") return <ShoppingBag size={16} />;
                  if (entity === "product") return <Package size={16} />;
                  if (entity === "user") return <Users size={16} />;
                  return <Settings size={16} />;
                };

                return (
                  <div
                    key={log._id || index}
                    className="px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-sky-100 transition">
                        {getEntityIcon(log.entity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(
                              log.action
                            )}`}
                          >
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1">
                          <span className="font-bold text-sky-700">{log.actorEmail}</span> modified{" "}
                          <span className="font-semibold">{log.entity}</span>
                        </p>
                        {log.diff && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs">
                <p className="text-gray-600">
                              {log.diff.before && log.diff.after && (
                                <>
                                  <span className="font-semibold">Changed:</span>{" "}
                                  {Object.keys(log.diff.after)
                                    .filter((key) => key !== "email")
                                    .map((key) => (
                                      <span key={key} className="inline-block mr-2">
                                        {key}
                                      </span>
                                    ))}
                                </>
                              )}
                </p>
              </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Settings size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black">System Information</h3>
              <p className="text-sm opacity-75">Server & environment details</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs opacity-75 mb-1">Server Status</p>
              <p className="font-bold">Running</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs opacity-75 mb-1">Database</p>
              <p className="font-bold">MongoDB Connected</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs opacity-75 mb-1">API Version</p>
              <p className="font-bold">v1.0.0</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs opacity-75 mb-1">Last Backup</p>
              <p className="font-bold">Auto-sync enabled</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-200 p-6 shadow-2xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center">
              <Shield size={22} className="text-white" />
        </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Health First
              </p>
              <h2 className="text-lg font-black">Admin Portal</h2>
            </div>
          </div>
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "products", label: "Products", icon: Package },
            { id: "customers", label: "Customers", icon: Users },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "system", label: "System", icon: Settings }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`w-full px-4 py-3.5 rounded-xl text-left flex items-center gap-3 text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-600/50"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-black text-gray-900 mb-1">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-sm text-gray-600">
                Manage your business operations from a centralized dashboard
              </p>
          </div>
            <button
              onClick={() => loadTabData(activeTab)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 text-white font-bold hover:from-sky-700 hover:to-sky-800 transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
            >
              <RefreshCcw size={16} /> Refresh
          </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-pulse">
            <CheckCircle size={20} />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <AlertTriangle size={20} />
            <span className="font-semibold">{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Loading data...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && renderContent()}
      </main>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-3 rounded-full ${
                  confirmModal.type === "danger"
                    ? "bg-red-100"
                    : confirmModal.type === "warning"
                    ? "bg-amber-100"
                    : "bg-sky-100"
                }`}
              >
                <AlertCircle
                  size={24}
                  className={
                    confirmModal.type === "danger"
                      ? "text-red-600"
                      : confirmModal.type === "warning"
                      ? "text-amber-600"
                      : "text-sky-600"
                  }
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 mb-2">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-gray-600">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={closeConfirmModal}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={confirmModal.confirmAction}
                className={`px-5 py-2.5 rounded-lg font-semibold text-white transition ${
                  confirmModal.type === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : confirmModal.type === "warning"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Update Modal */}
      {isLocationModalOpen && locationUpdateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-gray-900">
                Update Order Status
              </h3>
              <button
                onClick={() => {
                  setIsLocationModalOpen(false);
                  setLocationUpdateData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Changing order <span className="font-bold text-gray-900">{locationUpdateData.orderNumber}</span> status to{" "}
                <span className="font-bold text-sky-600">{locationUpdateData.status}</span>
              </p>

              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Current Location / Address *
              </label>
              <input
                type="text"
                value={locationUpdateData.currentLocation}
                onChange={(e) =>
                  setLocationUpdateData({
                    ...locationUpdateData,
                    currentLocation: e.target.value
                  })
                }
                placeholder="e.g., Mumbai Distribution Center, On the way to Bangalore"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-2">
                This location will be displayed to the customer in their order tracking.
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setIsLocationModalOpen(false);
                  setLocationUpdateData(null);
                }}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationUpdate}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg font-semibold text-white transition bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900">
                {editingProductId ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setProductForm(defaultProductForm);
                  setEditingProductId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Product Name *
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter product name"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">SKU *</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter SKU"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Weight *</label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="e.g., 1kg"
                  value={productForm.weight}
                  onChange={(e) => setProductForm((p) => ({ ...p, weight: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Price</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter price"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, price: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Stock</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter stock quantity"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Discount %
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter discount"
                  value={productForm.discountPercentage}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, discountPercentage: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Image URL</label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                placeholder="Enter image URL"
                value={productForm.image}
                onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))}
              />
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                placeholder="Enter product description"
                rows={4}
                value={productForm.description}
                onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setProductForm(defaultProductForm);
                }}
                className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-5 py-3 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition flex items-center gap-2"
              >
                <Save size={18} /> {editingProductId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-black text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-600">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-sky-50 to-transparent rounded-xl p-4 border border-sky-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={16} /> Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-900">{selectedOrder.userEmail}</span>
                  </div>
                  {selectedOrder.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-900">+{selectedOrder.phone}</span>
                    </div>
                  )}
                  {selectedOrder.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-semibold text-gray-900 text-right max-w-xs">
                        {selectedOrder.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={16} /> Order Items
                </h4>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × Rs {item.price}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        Rs {(item.price * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-transparent rounded-xl p-4 border border-emerald-100">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard size={16} /> Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      Rs {Number(selectedOrder.subtotal || 0).toFixed(0)}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        -Rs {Number(selectedOrder.discount || 0).toFixed(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold">
                      {selectedOrder.shipping === 0
                        ? "FREE"
                        : `Rs ${Number(selectedOrder.shipping || 0).toFixed(0)}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-black text-xl text-emerald-600">
                      Rs {Number(selectedOrder.totalAmount || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">
                    Order Status
                  </label>
                  <span className="px-4 py-2 rounded-lg bg-sky-100 text-sky-700 text-sm font-bold inline-block">
                    {formatStatusDisplay(selectedOrder.orderStatus || "placed")}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">
                    Payment Status
                  </label>
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-bold inline-block ${
                      selectedOrder.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {formatStatusDisplay(selectedOrder.paymentStatus || "pending")}
                  </span>
                </div>
              </div>

              {/* Order Date */}
              <div className="text-sm text-gray-600 pt-4 border-t border-gray-200">
                Order placed on {new Date(selectedOrder.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-5 rounded-t-2xl text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black">
                  {(selectedCustomer.name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedCustomer.name || "Unnamed"}</h3>
                  <p className="text-sm opacity-90">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsEditingCustomer(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-sky-50 to-transparent p-4 rounded-xl border border-sky-100 text-center">
                  <p className="text-xs text-gray-600 mb-2">Role</p>
                  <p className="text-lg font-black text-sky-600 capitalize">
                    {selectedCustomer.role}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-transparent p-4 rounded-xl border border-emerald-100 text-center">
                  <p className="text-xs text-gray-600 mb-2">Orders</p>
                  <p className="text-lg font-black text-emerald-600">
                    {selectedCustomer.totalOrders || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-transparent p-4 rounded-xl border border-violet-100 text-center">
                  <p className="text-xs text-gray-600 mb-2">Lifetime Value</p>
                  <p className="text-lg font-black text-violet-600">
                    Rs {Number(selectedCustomer.totalSpent || 0).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900">Contact Information</h4>
                  {!isEditingCustomer && (
                    <button
                      onClick={startEditingCustomer}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-sm font-semibold hover:bg-sky-100 transition"
                    >
                      <Edit size={14} />
                      <span>Edit Info</span>
                    </button>
                  )}
                </div>

                {customerEditErrors._general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">{customerEditErrors._general}</p>
                  </div>
                )}

                {isEditingCustomer ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Name</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={customerEditDraft.name}
                        onChange={(e) =>
                          setCustomerEditDraft((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className={`w-full p-3 rounded-lg border text-sm ${
                          customerEditErrors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      />
                      {customerEditErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{customerEditErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone</label>
                      <input
                        type="tel"
                        placeholder="10-digit phone number"
                        value={customerEditDraft.phone}
                        onChange={(e) =>
                          setCustomerEditDraft((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className={`w-full p-3 rounded-lg border text-sm ${
                          customerEditErrors.phone ? "border-red-300 bg-red-50" : "border-gray-200"
                        }`}
                      />
                      {customerEditErrors.phone && (
                        <p className="mt-1 text-xs text-red-600">{customerEditErrors.phone}</p>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
                      <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEditingCustomer}
                        disabled={isCustomerSubmitting}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCustomerInfo}
                        disabled={isCustomerSubmitting}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-60"
                      >
                        <Save size={16} />
                        <span>{isCustomerSubmitting ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedCustomer.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedCustomer.phone ? `+91 ${selectedCustomer.phone}` : "Not provided"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Addresses */}
              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900">Saved Addresses</h4>
                  <div className="space-y-2">
                    {selectedCustomer.addresses.map((addr: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="font-semibold text-gray-900 mb-1">
                          {addr.label || "Address"} {addr.isDefault && "(Default)"}
                        </p>
                        <p className="text-gray-600">
                          {addr.addressLine}, {addr.city} - {addr.zip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isEditingCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full px-5 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
