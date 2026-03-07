const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    userEmail: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: ""
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        image: String,
        name: String,
        quantity: Number,
        price: Number,
        discountPercentage: Number
      }
    ],

    subtotal: Number,
    discount: Number,
    taxableAmount: Number,
    gstRate: Number,
    gstAmount: Number,
    shipping: Number,
    totalAmount: Number,

    address: String,
    paymentMethod: String,
    paymentGateway: {
      type: String,
      default: "none"
    },
    paymentStatus: {
      type: String,
      default: "pending"
    },
    paymentOrderId: String,
    paymentId: String,
    paymentSignature: String,

    orderStatus: {
      type: String,
      default: "placed"
    },

    trackingSteps: [
      {
        title: String,
        completed: Boolean,
        date: String
      }
    ],

    // Enhanced tracking information
    trackingInfo: {
      originLocation: {
        type: String,
        default: "Bendoorwell, Bendoor, Mangaluru, Karnataka, Mangaluru, Dakshina Kannada - 575002"
      },
      destinationLocation: String,
      currentLocation: String,
      estimatedDelivery: Date,
      courierPartner: {
        type: String,
        default: "HealthFirst Express"
      },
      courierContact: {
        type: String,
        default: "+91 8242345678"
      },
      trackingNumber: String,
      deliveryPersonName: String,
      deliveryPersonPhone: String,
      packageWeight: String,
      packageDimensions: String,
      lastUpdated: Date,
      locationHistory: [
        {
          location: String,
          status: String,
          timestamp: Date,
          description: String
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);