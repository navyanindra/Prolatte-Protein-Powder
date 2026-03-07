import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection with caching for serverless
let cachedDb = null;
let app = null;

async function connectDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    // Dynamic imports for models
    const { default: Product } = await import('../health-first-backend/health-first-backend/models/Product.js');
    const { default: User } = await import('../health-first-backend/health-first-backend/models/User.js');
    
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

async function getApp() {
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

  // Dynamic imports for routes
  const { default: authRoutes } = await import('../health-first-backend/health-first-backend/routes/auth.js');
  const { default: productsRoutes } = await import('../health-first-backend/health-first-backend/routes/products.js');
  const { default: ordersRoutes } = await import('../health-first-backend/health-first-backend/routes/orders.js');
  const { default: adminRoutes } = await import('../health-first-backend/health-first-backend/routes/admin.js');
  const { default: paymentsRoutes } = await import('../health-first-backend/health-first-backend/routes/payments.js');

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/payments", paymentsRoutes);

  app.get("/api", (req, res) => {
    res.json({ message: "HealthFirst API Running 🚀" });
  });
  
  return app;
}

// Serverless function handler
export default async function handler(req, res) {
  try {
    await connectDatabase();
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
}
