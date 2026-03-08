const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Database connection with caching for serverless
let cachedDb = null;
let app = null;

async function connectDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const Product = require('../health-first-backend/health-first-backend/models/Product.js');
    const User = require('../health-first-backend/health-first-backend/models/User.js');
    
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
        stock: 50,
        sku: "PROLATTE-500G",
        weight: "500g",
        description:
          "High-quality doctor-recommended daily protein with added Vitamin K, B Complex, and Calcium. Perfect for muscle recovery and daily nutrition.",
        image: "/prolatte-left.png",
        gallery: ["/prolatte-left.png", "/prolatte-right.png"]
      });
      console.log("✅ Default product seeded");
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
        console.log("✅ Admin user created");
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
          console.log("✅ Admin user updated");
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

  // Load routes
  const authRoutes = require('../health-first-backend/health-first-backend/routes/auth.js');
  const productsRoutes = require('../health-first-backend/health-first-backend/routes/products.js');
  const ordersRoutes = require('../health-first-backend/health-first-backend/routes/orders.js');
  const adminRoutes = require('../health-first-backend/health-first-backend/routes/admin.js');
  const paymentsRoutes = require('../health-first-backend/health-first-backend/routes/payments.js');

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/payments", paymentsRoutes);

  app.get("/api", (req, res) => {
    res.json({ 
      message: "HealthFirst API Running 🚀", 
      routes: ["auth", "products", "orders", "admin", "payments"],
      timestamp: new Date().toISOString()
    });
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error("Express error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  });
  
  return app;
}

// Serverless function handler
module.exports = async function handler(req, res) {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    await connectDatabase();
    const expressApp = getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
