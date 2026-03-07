const router = require("express").Router();
const Product = require("../models/Product");
const { requireAdmin } = require("../middleware/auth");

router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post("/", requireAdmin, async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

module.exports = router;
