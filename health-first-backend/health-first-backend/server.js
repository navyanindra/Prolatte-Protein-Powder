const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Product = require("./models/Product");
const User = require("./models/User");

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://healthfirstlifesciences.com', 'https://www.healthfirstlifesciences.com', 'https://*.vercel.app']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

app.use(express.json());

// 🔹 Mongoose Connection Events
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.log("❌ Mongoose error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected");
});

// 🔹 Connect DB and Start Server ONLY if successful
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 MongoDB Connected Successfully");

    // 🔹 Seed default product once if collection is empty
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.create({
        name: "ProLatte Protein powder",
        price: 800,
        description:
          "High-quality doctor-recommended daily protein with added Vitamin K, B Complex, and Calcium. Perfect for muscle recovery and daily nutrition.",
        image: "/img1.png",
      });
      console.log("🌱 Seeded default ProLatte product");
    }

    // Ensure admin user exists from environment credentials.
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "");
    if (adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail });
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      if (!existingAdmin) {
        await User.create({
          name: "Admin",
          email: adminEmail,
          password: hashedPassword,
          role: "admin"
        });
        console.log("🔐 Admin account created from .env");
      } else {
        let shouldSave = false;
        if (existingAdmin.role !== "admin") {
          existingAdmin.role = "admin";
          shouldSave = true;
        }

        const passwordMatches = await bcrypt.compare(adminPassword, existingAdmin.password || "");
        if (!passwordMatches) {
          existingAdmin.password = hashedPassword;
          shouldSave = true;
        }

        if (shouldSave) {
          await existingAdmin.save();
          console.log("🔐 Admin account updated from .env");
        }
      }
    } else {
      console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set; admin seeding skipped.");
    }

    app.use("/api/auth", require("./routes/auth"));
    app.use("/api/products", require("./routes/products"));
    app.use("/api/orders", require("./routes/orders"));
    app.use("/api/admin", require("./routes/admin"));
    app.use("/api/payments", require("./routes/payments"));

    app.get("/", (req, res) => {
      res.send("Health First Backend Running 🚀");
    });

    app.listen(5000, () => {
      console.log("🔥 Server running on port 5000");
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB", error);
    process.exit(1); // Stops server completely
  }
}

// For Vercel serverless deployment
if (process.env.VERCEL) {
  module.exports = app;
} else {
  startServer();
}