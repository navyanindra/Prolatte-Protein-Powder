const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Database connection with caching for serverless
let cachedDb = null;
let app = null;

async function connectDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const Product = require("../health-first-backend/health-first-backend/models/Product");
    const User = require("../health-first-backend/health-first-backend/models/User");
    
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedDb = db;
    console.log("✅ MongoDB Connected");

    // Seed default product if needed
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.create({
        name: "ProLatte Protein powder",
        price: 800,
        description:
          "High-quality doctor-recommended daily protein with added Vitamin K, B Complex, and Calcium. Perfect for muscle recovery and daily nutrition.",
        image: "/img1.png",
      });
    }

    // Ensure admin exists
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
        }
      }
    }

    return db;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

function getApp() {
  if (app) return app;
  
  app = express();
  app.disable("x-powered-by");

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json());

  // Routes
  app.use("/api/auth", require("../health-first-backend/health-first-backend/routes/auth"));
  app.use("/api/products", require("../health-first-backend/health-first-backend/routes/products"));
  app.use("/api/orders", require("../health-first-backend/health-first-backend/routes/orders"));
  app.use("/api/admin", require("../health-first-backend/health-first-backend/routes/admin"));
  app.use("/api/payments", require("../health-first-backend/health-first-backend/routes/payments"));

  app.get("/api", (req, res) => {
    res.json({ message: "HealthFirst API Running 🚀" });
  });
  
  return app;
}

// Serverless function handler
module.exports = async (req, res) => {
  try {
    await connectDatabase();
    const expressApp = getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
};
