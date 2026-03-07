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
  AlertTriangle
} from "lucide-react";
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

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      if (tab === "overview") await fetchDashboard();
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

  const topMetrics = useMemo(
    () => [
      { label: "Revenue", value: `Rs ${summary.totalRevenue.toFixed(0)}` },
      { label: "Orders Today", value: String(summary.ordersToday) },
      { label: "Customers", value: String(summary.customers) },
      { label: "Low Stock Items", value: String(summary.lowStockCount) }
    ],
    [summary]
  );

  const updateOrder = async (orderId: string, orderStatus: string, paymentStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { orderStatus, paymentStatus });
      await fetchOrders();
      await fetchDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update order");
    }
  };

  const saveProduct = async () => {
    try {
      await api.post("/admin/products", productForm);
      setProductForm(defaultProductForm);
      await fetchProducts();
      await fetchDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create product");
    }
  };

  const updateCustomerRole = async (customerId: string, role: string) => {
    try {
      await api.patch(`/admin/customers/${customerId}/role`, { role });
      await fetchCustomers();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update customer role");
    }
  };

  const renderContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {topMetrics.map((item) => (
              <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-2">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900">Recent Orders</h3>
              <button onClick={() => loadTabData("overview")} className="text-sm text-sky-700 font-bold flex items-center gap-2">
                <RefreshCcw size={14} /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-widest">
                  <tr>
                    <th className="px-6 py-3 text-left">Order</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Payment</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="px-6 py-4 font-semibold">{o.orderNumber || o.id}</td>
                      <td className="px-6 py-4">{o.customerName}</td>
                      <td className="px-6 py-4">Rs {Number(o.total || 0).toFixed(0)}</td>
                      <td className="px-6 py-4">{o.paymentStatus || "pending"}</td>
                      <td className="px-6 py-4">{o.orderStatus || "placed"}</td>
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
      return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900">Order Management</h3>
            <button onClick={() => fetchOrders()} className="text-sm text-sky-700 font-bold">Reload</button>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.map((o) => (
              <div key={o._id} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                <div className="md:col-span-2">
                  <p className="font-bold text-gray-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500">{o.userEmail}</p>
                  {o.phone ? <p className="text-xs text-gray-500">Phone: +{o.phone}</p> : null}
                </div>
                <div className="font-bold">Rs {Number(o.totalAmount || 0).toFixed(0)}</div>
                <select
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
                  value={o.orderStatus || "placed"}
                  onChange={(e) => updateOrder(o._id, e.target.value, o.paymentStatus)}
                >
                  <option value="placed">placed</option>
                  <option value="confirmed">confirmed</option>
                  <option value="shipped">shipped</option>
                  <option value="out_for_delivery">out_for_delivery</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <select
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
                  value={o.paymentStatus || "pending"}
                  onChange={(e) => updateOrder(o._id, o.orderStatus || "placed", e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                </select>
                <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "products") {
      return (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Weight" value={productForm.weight} onChange={(e) => setProductForm((p) => ({ ...p, weight: e.target.value }))} />
            <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))} />
            <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))} />
            <input type="number" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Discount %" value={productForm.discountPercentage} onChange={(e) => setProductForm((p) => ({ ...p, discountPercentage: Number(e.target.value) }))} />
            <input className="md:col-span-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))} />
            <textarea className="md:col-span-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={saveProduct} className="md:col-span-3 px-4 py-3 rounded-lg bg-sky-600 text-white font-black flex items-center justify-center gap-2">
              <Save size={16} /> Add Product
            </button>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 font-black">Inventory</div>
            <div className="divide-y divide-gray-100">
              {products.map((p) => (
                <div key={p._id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku} • {p.weight}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold mr-4">Stock: {p.stock}</span>
                    <span>Rs {Number(p.price).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "customers") {
      return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-black">Customer Management</div>
          <div className="divide-y divide-gray-100">
            {customers.map((c) => (
              <div key={c._id} className="px-6 py-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                <div className="md:col-span-2">
                  <p className="font-bold text-gray-900">{c.name || "Unnamed"}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </div>
                <div>Orders: {c.totalOrders || 0}</div>
                <div>Spent: Rs {Number(c.totalSpent || 0).toFixed(0)}</div>
                <select
                  className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
                  value={c.role}
                  onChange={(e) => updateCustomerRole(c._id, e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <div className="text-xs text-gray-500">{c.phone || "No phone"}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "payments") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentSummary.map((s) => (
              <div key={s._id || "unknown"} className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-black">{s._id || "unknown"}</p>
                <p className="text-xl font-black text-gray-900 mt-1">{s.count}</p>
                <p className="text-sm text-gray-500">Rs {Number(s.total || 0).toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 font-black">Payment Tracker</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-widest">
                  <tr>
                    <th className="px-6 py-3 text-left">Order</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Gateway</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-t border-gray-100">
                      <td className="px-6 py-4 font-semibold">{p.orderNumber}</td>
                      <td className="px-6 py-4">{p.userEmail}</td>
                      <td className="px-6 py-4">Rs {Number(p.totalAmount || 0).toFixed(0)}</td>
                      <td className="px-6 py-4">{p.paymentGateway || "none"}</td>
                      <td className="px-6 py-4">{p.paymentStatus || "pending"}</td>
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
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 mb-4">Revenue (Last 30 Days)</h3>
            <div className="space-y-2">
              {(analytics.revenueByDay || []).map((row: any) => (
                <div key={`${row._id?.year}-${row._id?.month}-${row._id?.day}`} className="flex justify-between text-sm">
                  <span className="text-gray-600">{`${row._id?.day}/${row._id?.month}/${row._id?.year}`}</span>
                  <span className="font-semibold">Rs {Number(row.revenue || 0).toFixed(0)} ({row.orders} orders)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h3 className="font-black text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-2">
              {(analytics.topProducts || []).map((item: any) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>{item._id}</span>
                  <span className="font-semibold">{item.quantity} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Users</p>
            <p className="text-2xl font-black mt-2">{system.db?.users || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Products</p>
            <p className="text-2xl font-black mt-2">{system.db?.products || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Orders</p>
            <p className="text-2xl font-black mt-2">{system.db?.orders || 0}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-black flex items-center gap-2">
            <Shield size={16} /> Admin Audit Log
          </div>
          <div className="divide-y divide-gray-100">
            {(system.auditLogs || []).map((log: any) => (
              <div key={log._id} className="px-6 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-gray-600">
                  {log.actorEmail} updated {log.entity} {log.entityId ? `(${log.entityId})` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-200 p-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-black">Health First</p>
          <h2 className="text-xl font-black mt-1">Secure Admin Console</h2>
        </div>
        <div className="space-y-2">
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
              className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 text-sm font-bold ${
                activeTab === item.id ? "bg-sky-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">All user-side operations controlled from secure console.</p>
          </div>
          <button onClick={() => loadTabData(activeTab)} className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 font-bold text-sm flex items-center gap-2">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        {loading && <div className="text-sm text-gray-500">Loading data...</div>}
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
