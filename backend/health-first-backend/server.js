const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Product = require("./models/Product");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Seed a default ProLatte product if the collection is empty
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.create({
        name: "ProLatte Protein powder",
        price: 800,
        description:
          "High-quality doctor-recommended daily protein with added Vitamin K, B Complex, and Calcium. Perfect for muscle recovery and daily nutrition.",
        image: "/img1.png",
      });
      console.log("Seeded default ProLatte product");
    }
  })
  .catch((err) => console.log(err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));

app.get("/", (req, res) => {
  res.send("Health First Backend Running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
