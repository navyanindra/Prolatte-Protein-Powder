const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    price: { type: Number, required: true },

    discountPercentage: {
      type: Number,
      default: 0
    },

    stock: {
      type: Number,
      required: true
    },

    sku: {
      type: String,
      required: true
    },

    weight: {
      type: String, // example: "1kg"
      required: true
    },

    description: String,

    image: String,

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);