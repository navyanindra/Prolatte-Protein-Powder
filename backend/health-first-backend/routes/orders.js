const router = require("express").Router();
const Order = require("../models/Order");

router.post("/", async (req, res) => {
  try {
    const { userEmail, items, totalAmount, address } = req.body;
    const orderNumber = "HF-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const order = await Order.create({ userEmail, items, totalAmount, address, orderNumber });
    res.json({ message: "Order placed", order });
  } catch (err) {
    console.error("Create order error", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get orders error", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.get("/user/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Get user orders error", err);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
});

module.exports = router;
