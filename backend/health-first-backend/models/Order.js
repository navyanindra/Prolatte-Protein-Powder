const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userEmail: String,
  items: Array,
  totalAmount: Number,
  address: String,
  orderNumber: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
