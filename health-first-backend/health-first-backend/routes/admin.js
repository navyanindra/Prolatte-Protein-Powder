const router = require("express").Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const AdminAuditLog = require("../models/AdminAuditLog");
const { requireAdmin } = require("../middleware/auth");

router.use(requireAdmin);

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePhone = (value = "") => String(value).replace(/\D/g, "");
const isValidPhone = (value = "") => {
  const digits = normalizePhone(value);
  return digits.length === 10;
};

const toOrderStatusLabel = (order) => order.orderStatus || order.status || "placed";

const createTrackingSteps = (status) => {
  const statusMap = {
    placed: "Order Placed",
    confirmed: "Order Confirmed",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };

  const orderedLabels = [
    "Order Placed",
    "Order Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered"
  ];

  if (status === "cancelled") {
    return [
      { title: "Order Placed", completed: true, date: new Date().toLocaleString() },
      { title: "Cancelled", completed: true, date: new Date().toLocaleString() }
    ];
  }

  const normalized = statusMap[status] || statusMap.placed;
  const currentIndex = orderedLabels.indexOf(normalized);

  return orderedLabels.map((title, index) => ({
    title,
    completed: index <= currentIndex,
    date: index <= currentIndex ? new Date().toLocaleString() : null
  }));
};

const writeAuditLog = async (req, payload) => {
  try {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    const ipAddress = forwardedFor || req.socket.remoteAddress || "";

    await AdminAuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId || "",
      diff: payload.diff || {},
      ipAddress
    });
  } catch (error) {
    console.error("Failed to write admin audit log:", error);
  }
};

router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, users, products, paidOrdersCount, pendingPayments] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(10),
      User.countDocuments(),
      Product.find().sort({ createdAt: -1 }).limit(8),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.countDocuments({ paymentStatus: { $in: ["pending", "failed"] } })
    ]);

    const [ordersToday, totalOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments()
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
    ]);

    const totalRevenue = revenueAgg[0]?.revenue || 0;

    const lowStockCount = await Product.countDocuments({ stock: { $lt: 20 } });

    const recentOrders = orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      customerName: o.phone ? `${o.userEmail} (${o.phone})` : o.userEmail,
      date: o.createdAt,
      total: o.totalAmount || 0,
      paymentStatus: o.paymentStatus || "pending",
      orderStatus: toOrderStatusLabel(o)
    }));

    res.json({
      summary: {
        totalRevenue,
        ordersToday,
        customers: users,
        totalOrders,
        paidOrders: paidOrdersCount,
        pendingPayments,
        lowStockCount
      },
      recentOrders,
      products
    });
  } catch (err) {
    console.error("Admin dashboard error", err);
    res.status(500).json({ message: "Failed to load admin dashboard" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : "";
    const paymentStatus = req.query.paymentStatus ? String(req.query.paymentStatus) : "";
    const search = req.query.search ? String(req.query.search).trim() : "";

    const filters = {};
    if (status) filters.orderStatus = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    if (search) {
      filters.$or = [
        { userEmail: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } }
      ];
    }

    const orders = await Order.find(filters).sort({ createdAt: -1 }).limit(250);
    res.json(orders);
  } catch (error) {
    console.error("Admin orders fetch failed", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previous = {
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    };

    if (orderStatus) {
      order.orderStatus = String(orderStatus);
      order.trackingSteps = createTrackingSteps(String(orderStatus));
    }

    if (paymentStatus) {
      order.paymentStatus = String(paymentStatus);
    }

    await order.save();

    await writeAuditLog(req, {
      action: "UPDATE_ORDER",
      entity: "order",
      entityId: order._id.toString(),
      diff: {
        before: previous,
        after: {
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error("Admin order update failed", error);
    res.status(500).json({ message: "Failed to update order" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { orderStatus, currentLocation } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!currentLocation || !currentLocation.trim()) {
      return res.status(400).json({ message: "Current location is required" });
    }

    const previous = {
      orderStatus: order.orderStatus,
      trackingInfo: order.trackingInfo
    };

    // Update order status
    order.orderStatus = String(orderStatus);
    order.trackingSteps = createTrackingSteps(String(orderStatus));

    // Initialize trackingInfo if it doesn't exist
    if (!order.trackingInfo) {
      order.trackingInfo = {
        originLocation: "Bendoorwell, Bendoor, Mangaluru, Karnataka, Dakshina Kannada - 575002",
        destinationLocation: order.address || "",
        currentLocation: "",
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        courierPartner: "HealthFirst Express",
        courierContact: "+91 8242345678",
        trackingNumber: `HFT${Date.now().toString().slice(-8)}`,
        lastUpdated: new Date(),
        locationHistory: []
      };
    }

    // Update current location and last updated
    order.trackingInfo.currentLocation = currentLocation.trim();
    order.trackingInfo.lastUpdated = new Date();

    // Add to location history
    if (!order.trackingInfo.locationHistory) {
      order.trackingInfo.locationHistory = [];
    }

    order.trackingInfo.locationHistory.push({
      location: currentLocation.trim(),
      status: orderStatus,
      timestamp: new Date(),
      description: `Status updated to ${orderStatus}`
    });

    // Mark trackingInfo as modified for Mongoose
    order.markModified('trackingInfo');

    await order.save();

    await writeAuditLog(req, {
      action: "UPDATE_ORDER_STATUS_WITH_LOCATION",
      entity: "order",
      entityId: order._id.toString(),
      diff: {
        before: previous,
        after: {
          orderStatus: order.orderStatus,
          currentLocation: order.trackingInfo.currentLocation
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error("Admin order status update with location failed", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Admin products fetch failed", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const payload = {
      name: String(req.body.name || "").trim(),
      price: sanitizeNumber(req.body.price),
      discountPercentage: sanitizeNumber(req.body.discountPercentage),
      stock: sanitizeNumber(req.body.stock),
      sku: String(req.body.sku || "").trim(),
      weight: String(req.body.weight || "").trim(),
      description: String(req.body.description || "").trim(),
      image: String(req.body.image || "").trim(),
      isActive: req.body.isActive !== false
    };

    if (!payload.name || !payload.sku || !payload.weight) {
      return res.status(400).json({ message: "name, sku and weight are required" });
    }

    const product = await Product.create(payload);

    await writeAuditLog(req, {
      action: "CREATE_PRODUCT",
      entity: "product",
      entityId: product._id.toString(),
      diff: { after: payload }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Admin product create failed", error);
    res.status(500).json({ message: "Failed to create product" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    console.log("PUT /admin/products/:id - Received request for ID:", req.params.id);
    console.log("Request body:", req.body);
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log("Product not found with ID:", req.params.id);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Found product:", product.name);
    const previous = product.toObject();
    product.name = String(req.body.name || product.name).trim();
    product.price = sanitizeNumber(req.body.price, product.price);
    product.discountPercentage = sanitizeNumber(
      req.body.discountPercentage,
      product.discountPercentage
    );
    product.stock = sanitizeNumber(req.body.stock, product.stock);
    product.sku = String(req.body.sku || product.sku).trim();
    product.weight = String(req.body.weight || product.weight).trim();
    product.description = String(req.body.description || product.description || "").trim();
    product.image = String(req.body.image || product.image || "").trim();
    if (typeof req.body.isActive === "boolean") {
      product.isActive = req.body.isActive;
    }

    await product.save();
    console.log("Product updated successfully:", product.name);

    await writeAuditLog(req, {
      action: "UPDATE_PRODUCT",
      entity: "product",
      entityId: product._id.toString(),
      diff: {
        before: previous,
        after: product.toObject()
      }
    });

    res.json(product);
  } catch (error) {
    console.error("Admin product update failed", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const customers = await User.find()
      .select("_id name email role phone addresses")
      .sort({ _id: -1 })
      .lean();

    const emails = customers.map((c) => c.email).filter(Boolean);
    const orderAgg = await Order.aggregate([
      { $match: { userEmail: { $in: emails } } },
      {
        $group: {
          _id: "$userEmail",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" }
        }
      }
    ]);

    const orderMap = new Map(orderAgg.map((o) => [String(o._id).toLowerCase(), o]));

    const normalized = customers.map((c) => {
      const stats = orderMap.get(String(c.email || "").toLowerCase());
      return {
        ...c,
        totalOrders: stats?.totalOrders || 0,
        totalSpent: stats?.totalSpent || 0
      };
    });

    res.json(normalized);
  } catch (error) {
    console.error("Admin customers fetch failed", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

router.patch("/customers/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const beforeRole = customer.role;
    customer.role = role;
    await customer.save();

    await writeAuditLog(req, {
      action: "UPDATE_USER_ROLE",
      entity: "user",
      entityId: customer._id.toString(),
      diff: {
        before: { role: beforeRole },
        after: { role: customer.role, email: customer.email }
      }
    });

    res.json({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      role: customer.role
    });
  } catch (error) {
    console.error("Admin customer role update failed", error);
    res.status(500).json({ message: "Failed to update customer role" });
  }
});

router.patch("/customers/:id", async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit phone number" });
    }

    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const beforeData = { name: customer.name, phone: customer.phone };
    customer.name = name.trim();
    customer.phone = normalizePhone(phone);
    await customer.save();

    await writeAuditLog(req, {
      action: "UPDATE_USER_INFO",
      entity: "user",
      entityId: customer._id.toString(),
      diff: {
        before: beforeData,
        after: { name: customer.name, phone: customer.phone, email: customer.email }
      }
    });

    res.json({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role
    });
  } catch (error) {
    console.error("Admin customer info update failed", error);
    res.status(500).json({ message: "Failed to update customer information" });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const payments = await Order.find()
      .select(
        "_id orderNumber userEmail totalAmount paymentStatus paymentMethod paymentGateway paymentOrderId paymentId createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(300);

    const summary = await Order.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({ payments, summary });
  } catch (error) {
    console.error("Admin payments fetch failed", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    last30Days.setHours(0, 0, 0, 0);

    const [revenueByDay, topProducts, statusBreakdown] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: last30Days } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            revenue: { 
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "paid"] },
                  "$totalAmount",
                  0
                ]
              }
            },
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      revenueByDay,
      topProducts,
      statusBreakdown
    });
  } catch (error) {
    console.error("Admin analytics failed", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

router.get("/system", async (req, res) => {
  try {
    const [dbStats, auditLogs] = await Promise.all([
      Promise.all([User.countDocuments(), Product.countDocuments(), Order.countDocuments()]),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(30)
    ]);

    res.json({
      db: {
        users: dbStats[0],
        products: dbStats[1],
        orders: dbStats[2]
      },
      auditLogs
    });
  } catch (error) {
    console.error("Admin system view failed", error);
    res.status(500).json({ message: "Failed to load system information" });
  }
});

// Special endpoint to update product images (one-time migration)
router.post("/migrate-product-images", async (req, res) => {
  try {
    const product = await Product.findOne({ name: "ProLatte Protein powder" });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.image = "/prolatte-front.png";
    product.gallery = ["/prolatte-front.png", "/prolatte-left.png", "/prolatte-right.png"];
    
    await product.save();
    
    res.json({ 
      message: "Product images updated successfully",
      product 
    });
  } catch (error) {
    console.error("Migration failed", error);
    res.status(500).json({ message: "Failed to update product images" });
  }
});

module.exports = router;
