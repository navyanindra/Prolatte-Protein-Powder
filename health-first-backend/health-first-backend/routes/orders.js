const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const { sendOrderConfirmationEmail } = require("../utils/orderEmail");
const { requireAdmin } = require("../middleware/auth");

const generateOrderNumber = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `HF-${new Date().getFullYear()}-${random}`;
};
const GST_RATE = 5;
const normalizePhone = (value = "") => String(value).replace(/\D/g, "");
const isValidPhone = (value = "") => {
  const digits = normalizePhone(value);
  return digits.length === 10;
};

// ✅ CREATE ORDER
router.post("/", async (req, res) => {
  try {
    const {
      items,
      userEmail,
      phone,
      address,
      paymentMethod,
      paymentGateway,
      paymentStatus,
      paymentOrderId,
      paymentId,
      paymentSignature
    } = req.body;

    if (!userEmail || !items || items.length === 0 || !isValidPhone(phone)) {
      return res
        .status(400)
        .json({ message: "Invalid order data. A valid phone number is required." });
    }

    let subtotal = 0;
    let gstAmount = 0;
    let orderItems = [];

    for (const item of items) {

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      const discountPercentage = product.discountPercentage || 0;

      const discountedPrice =
        discountPercentage > 0
          ? Math.round(
              product.price -
              (product.price * discountPercentage) / 100
            )
          : product.price;

      const lineTotal = discountedPrice * item.quantity;
      subtotal += lineTotal;
      gstAmount += lineTotal * (GST_RATE / (100 + GST_RATE));

      orderItems.push({
        productId: product._id,
        image: product.image || "",
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        discountPercentage
      });

      // ✅ Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const discount = 0; // already included in subtotal
    const normalizedGstAmount = Number(gstAmount.toFixed(2));
    const taxableAmount = Number((subtotal - normalizedGstAmount).toFixed(2));
    const shipping = subtotal > 999 ? 0 : 50;
    const totalAmount = subtotal + shipping;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),

      userEmail,
      phone: normalizePhone(phone),
      items: orderItems,
      subtotal,
      discount,
      taxableAmount,
      gstRate: GST_RATE,
      gstAmount: normalizedGstAmount,
      shipping,
      totalAmount,
      address,
      paymentMethod,
      paymentGateway: paymentGateway || "none",
      paymentStatus: paymentStatus || "pending",
      paymentOrderId: paymentOrderId || "",
      paymentId: paymentId || "",
      paymentSignature: paymentSignature || "",
      orderStatus: "placed",

      trackingSteps: [
        { title: "Order Placed", completed: true, date: new Date().toLocaleString() },
        { title: "Order Confirmed", completed: false },
        { title: "Shipped", completed: false },
        { title: "Out for Delivery", completed: false },
        { title: "Delivered", completed: false }
      ],

      trackingInfo: {
        originLocation: "Bendoorwell, Bendoor, Mangaluru, Karnataka, Mangaluru, Dakshina Kannada - 575002",
        destinationLocation: address || "To be confirmed",
        currentLocation: "Bendoorwell, Bendoor, Mangaluru - Order Processing",
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        courierPartner: "HealthFirst Express",
        courierContact: "+91 8242345678",
        trackingNumber: `HFT${Date.now().toString().slice(-8)}`,
        deliveryPersonName: "",
        deliveryPersonPhone: "",
        packageWeight: `${(orderItems.reduce((acc, item) => acc + item.quantity, 0) * 0.5).toFixed(1)} kg`,
        packageDimensions: "30 x 20 x 15 cm",
        lastUpdated: new Date(),
        locationHistory: [
          {
            location: "Bendoorwell, Bendoor, Mangaluru",
            status: "Order Placed",
            timestamp: new Date(),
            description: "Your order has been placed successfully and is being prepared for shipment."
          }
        ]
      }
    });

    // Send confirmation email in background after successful order creation.
    sendOrderConfirmationEmail(order).catch((mailError) => {
      console.error("Order email send error:", mailError.message || mailError);
    });

    res.status(201).json({ success: true, order });

  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ message: "Order failed" });
  }
});


// ✅ GET SINGLE ORDER BY ID (moved outside properly)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET ORDERS BY USER EMAIL
router.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const orders = await Order.find({ userEmail: email })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("Fetch user orders error:", error);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
});

// ✅ UPDATE ORDER STATUS (ADMIN)
router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;

    const stepsOrder = [
      "Order Placed",
      "Order Confirmed",
      "Shipped",
      "Out for Delivery",
      "Delivered"
    ];

    order.trackingSteps = stepsOrder.map(step => ({
      title: step,
      completed: stepsOrder.indexOf(step) <= stepsOrder.indexOf(status),
      date:
        stepsOrder.indexOf(step) <= stepsOrder.indexOf(status)
          ? new Date().toLocaleString()
          : null
    }));

    await order.save();

    res.json(order);

  } catch (error) {
    res.status(500).json({ message: "Error updating status" });
  }
});


module.exports = router;