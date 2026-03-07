const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        message:
          "Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env."
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `hf_${Date.now()}`,
      notes: notes || {}
    });

    res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order: razorpayOrder
    });
  } catch (error) {
    console.error("Create Razorpay order failed:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

router.post("/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid verification payload" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({
        message:
          "Razorpay key secret is missing. Add RAZORPAY_KEY_SECRET in backend .env."
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    res.json({ success: true, message: "Payment verified" });
  } catch (error) {
    console.error("Verify Razorpay payment failed:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;

