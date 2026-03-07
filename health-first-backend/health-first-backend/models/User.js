const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    addressLine: { type: String, default: "" },
    city: { type: String, default: "" },
    zip: { type: String, default: "" },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  phone: { type: String, default: "" },
  addresses: { type: [addressSchema], default: [] }
});

module.exports = mongoose.model("User", userSchema);
