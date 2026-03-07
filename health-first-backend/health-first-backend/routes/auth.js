const router = require("express").Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { requireAuth, requireAdmin, getTokenFromRequest } = require("../middleware/auth");

const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_MAX_ATTEMPTS = 5;
const adminLoginAttempts = new Map();
const ADMIN_2FA_ENABLED = false;

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const normalizePhone = (value = "") => String(value).replace(/\D/g, "");
const isValidPhone = (value = "") => {
  const digits = normalizePhone(value);
  return digits.length === 10;
};

const createAuthToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const createAdminToken = (userId) =>
  jwt.sign({ id: userId, sessionType: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "30m"
  });

const getSafeUser = (userDoc) => ({
  _id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  phone: userDoc.phone || "",
  addresses: Array.isArray(userDoc.addresses) ? userDoc.addresses : []
});

const resolveUserFromRequest = async (req) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(payload.id);
};

const getIpAddress = (req) =>
  String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();

const isAdminLoginBlocked = (ipAddress) => {
  const state = adminLoginAttempts.get(ipAddress);
  if (!state) return false;

  if (Date.now() > state.expiresAt) {
    adminLoginAttempts.delete(ipAddress);
    return false;
  }

  return state.count >= ADMIN_MAX_ATTEMPTS;
};

const registerAdminFailure = (ipAddress) => {
  const current = adminLoginAttempts.get(ipAddress);
  if (!current || Date.now() > current.expiresAt) {
    adminLoginAttempts.set(ipAddress, {
      count: 1,
      expiresAt: Date.now() + ADMIN_LOGIN_WINDOW_MS
    });
    return;
  }

  adminLoginAttempts.set(ipAddress, {
    count: current.count + 1,
    expiresAt: current.expiresAt
  });
};

const clearAdminFailures = (ipAddress) => {
  adminLoginAttempts.delete(ipAddress);
};

const cleanupExpiredAdminOtpSessions = () => {};

const createEmailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

const hashOtp = (email, otp) =>
  crypto.createHash("sha256").update(`${normalizeEmail(email)}:${String(otp)}`).digest("hex");

const sendAdminOtpEmail = async (email, otp) => {
  const transporter = createEmailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transporter || !fromAddress) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 8px;">Admin OTP Verification</h2>
      <p style="margin:0 0 12px;">Use the OTP below to complete your HealthFirst admin login:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;text-align:center;">
        <p style="font-size:32px;letter-spacing:6px;font-weight:800;margin:0;">${otp}</p>
      </div>
      <p style="margin:12px 0 0;color:#475569;">This OTP expires in 10 minutes.</p>
      <p style="margin:6px 0 0;color:#475569;">If this was not you, please change the admin password immediately.</p>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: "HealthFirst Admin OTP",
    html
  });
};

const normalizeExistingAddress = (item) => ({
  ...(item.toObject ? item.toObject() : item)
});

const ensureSingleDefaultAddress = (addresses = []) => {
  if (!addresses.length) return [];
  const hasDefault = addresses.some((item) => Boolean(item.isDefault));
  if (hasDefault) return addresses;

  return addresses.map((item, index) => ({
    ...normalizeExistingAddress(item),
    isDefault: index === 0
  }));
};

const getAddressIndexById = (addresses = [], addressId = "") =>
  addresses.findIndex(
    (item) => String(item?._id || item?.id) === String(addressId)
  );

const sanitizeAddressPayload = (payload = {}) => ({
  label: payload.label || "Address",
  fullName: payload.fullName || "",
  email: payload.email || "",
  addressLine: payload.addressLine || "",
  city: payload.city || "",
  zip: payload.zip || ""
});

router.post("/register", async (req, res) => {
  try {
    const { name, password, phone } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!isValidPhone(phone)) {
      return res
        .status(400)
        .json({ message: "A valid 10-digit phone number is required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

  const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashed,
      phone: normalizePhone(phone)
    });

  res.json({ message: "Registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = createAuthToken(user._id);
    res.json({ token, user: getSafeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/admin/request-otp", async (req, res) => {
  try {
    if (!ADMIN_2FA_ENABLED) {
      return res.status(410).json({
        message: "Admin OTP login is disabled. Use /api/auth/admin/login."
      });
    }
    const ipAddress = getIpAddress(req);
    if (isAdminLoginBlocked(ipAddress)) {
      return res.status(429).json({
        message: "Too many failed admin login attempts. Try again after 15 minutes."
      });
    }

    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
      registerAdminFailure(ipAddress);
      return res.status(403).json({ message: "Admin account required" });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      registerAdminFailure(ipAddress);
      return res.status(400).json({ message: "Wrong password" });
    }

    cleanupExpiredAdminOtpSessions();
    const existingSession = adminOtpSessions.get(email);
    if (
      existingSession &&
      Date.now() - existingSession.lastOtpSentAt < ADMIN_OTP_RESEND_GAP_MS
    ) {
      return res.status(429).json({
        message: "OTP already sent. Please wait 60 seconds before requesting again."
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await sendAdminOtpEmail(email, otp);

    adminOtpSessions.set(email, {
      userId: user._id.toString(),
      otpHash: hashOtp(email, otp),
      attemptsLeft: ADMIN_OTP_MAX_ATTEMPTS,
      expiresAt: Date.now() + ADMIN_OTP_EXPIRY_MS,
      lastOtpSentAt: Date.now(),
      ipAddress
    });

    clearAdminFailures(ipAddress);
    res.json({ message: "OTP sent to admin email", otpExpiresInSeconds: 600 });
  } catch (error) {
    if (String(error.message || "") === "SMTP_NOT_CONFIGURED") {
      return res.status(503).json({
        message: "SMTP is not configured. Set SMTP_* env variables in backend."
      });
    }
    res.status(500).json({ message: "Failed to send admin OTP" });
  }
});

router.post("/admin/verify-otp", async (req, res) => {
  try {
    if (!ADMIN_2FA_ENABLED) {
      return res.status(410).json({
        message: "Admin OTP login is disabled. Use /api/auth/admin/login."
      });
    }
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    cleanupExpiredAdminOtpSessions();
    const session = adminOtpSessions.get(email);
    if (!session || Date.now() > session.expiresAt) {
      adminOtpSessions.delete(email);
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (session.otpHash !== hashOtp(email, otp)) {
      session.attemptsLeft -= 1;
      if (session.attemptsLeft <= 0) {
        adminOtpSessions.delete(email);
        registerAdminFailure(getIpAddress(req));
        return res.status(429).json({
          message: "Too many wrong OTP attempts. Please login again."
        });
      }
      adminOtpSessions.set(email, session);
      return res.status(400).json({
        message: `Invalid OTP. Attempts left: ${session.attemptsLeft}`
      });
    }

    const user = await User.findById(session.userId);
    if (!user || user.role !== "admin") {
      adminOtpSessions.delete(email);
      return res.status(403).json({ message: "Admin account required" });
    }

    adminOtpSessions.delete(email);
    clearAdminFailures(getIpAddress(req));

    const token = createAdminToken(user._id);
    res.json({
      token,
      user: getSafeUser(user),
      expiresInSeconds: 1800
    });
  } catch (error) {
    res.status(500).json({ message: "Admin OTP verification failed" });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const ipAddress = getIpAddress(req);
    if (isAdminLoginBlocked(ipAddress)) {
      return res.status(429).json({
        message: "Too many failed admin login attempts. Try again after 15 minutes."
      });
    }

    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || user.role !== "admin") {
      registerAdminFailure(ipAddress);
      return res.status(403).json({ message: "Admin account required" });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      registerAdminFailure(ipAddress);
      return res.status(400).json({ message: "Wrong password" });
    }

    clearAdminFailures(ipAddress);
    const token = createAdminToken(user._id);
    res.json({
      token,
      user: getSafeUser(user),
      expiresInSeconds: 1800,
      otpBypassed: true
    });
  } catch (error) {
    res.status(500).json({ message: "Admin login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: getSafeUser(req.user) });
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const resolvedUser = req.user;
    const { name, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!isValidPhone(phone)) {
      return res
        .status(400)
        .json({ message: "Enter a valid 10-digit phone number" });
    }

    resolvedUser.name = name.trim();
    resolvedUser.phone = normalizePhone(phone);

    await resolvedUser.save();

    res.json({ message: "Profile updated successfully", user: getSafeUser(resolvedUser) });
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.get("/admin/me", requireAdmin, async (req, res) => {
  res.json({ user: getSafeUser(req.user) });
});

router.put("/profile/address", requireAuth, async (req, res) => {
  try {
    const resolvedUser = req.user;

    const { label, fullName, email, addressLine, city, zip, makeDefault } =
      req.body;
    const incomingPhone = req.body.phone;

    if (!fullName || !email || !addressLine || !city || !zip) {
      return res.status(400).json({ message: "All address fields are required" });
    }
    if (incomingPhone && !isValidPhone(incomingPhone)) {
      return res
        .status(400)
        .json({ message: "Enter a valid 10-digit phone number" });
    }
    if (!incomingPhone && !isValidPhone(resolvedUser.phone || "")) {
      return res
        .status(400)
        .json({ message: "Phone number is required for delivery updates" });
    }

    if (makeDefault || resolvedUser.addresses.length === 0) {
      resolvedUser.addresses = resolvedUser.addresses.map((item) => ({
        ...normalizeExistingAddress(item),
        isDefault: false
      }));
    }

    resolvedUser.name = fullName;
    if (incomingPhone) {
      resolvedUser.phone = normalizePhone(incomingPhone);
    }

    resolvedUser.addresses.push({
      label: label || "Address",
      fullName,
      email,
      addressLine,
      city,
      zip,
      isDefault: Boolean(makeDefault) || resolvedUser.addresses.length === 0
    });

    resolvedUser.addresses = ensureSingleDefaultAddress(resolvedUser.addresses);
    await resolvedUser.save();

    res.json({ message: "Address saved", user: getSafeUser(resolvedUser) });
  } catch (error) {
    console.error("Failed to save address:", error);
    res.status(500).json({ message: "Failed to save address" });
  }
});

router.patch("/profile/address/:addressId", requireAuth, async (req, res) => {
  try {
    const resolvedUser = req.user;
    const incomingPhone = req.body.phone;

    const { addressId } = req.params;
    const idx = getAddressIndexById(resolvedUser.addresses, addressId);
    if (idx === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    const next = sanitizeAddressPayload(req.body);
    if (!next.fullName || !next.email || !next.addressLine || !next.city || !next.zip) {
      return res.status(400).json({ message: "All address fields are required" });
    }
    if (incomingPhone && !isValidPhone(incomingPhone)) {
      return res
        .status(400)
        .json({ message: "Enter a valid 10-digit phone number" });
    }

    resolvedUser.addresses[idx] = {
      ...normalizeExistingAddress(resolvedUser.addresses[idx]),
      ...next
    };

    if (req.body.makeDefault) {
      resolvedUser.addresses = resolvedUser.addresses.map((item, index) => ({
        ...normalizeExistingAddress(item),
        isDefault: index === idx
      }));
    } else {
      resolvedUser.addresses = ensureSingleDefaultAddress(resolvedUser.addresses);
    }

    resolvedUser.name = next.fullName || resolvedUser.name;
    if (incomingPhone) {
      resolvedUser.phone = normalizePhone(incomingPhone);
    }
    await resolvedUser.save();
    res.json({ message: "Address updated", user: getSafeUser(resolvedUser) });
  } catch (error) {
    console.error("Failed to update address:", error);
    res.status(500).json({ message: "Failed to update address" });
  }
});

router.patch("/profile/address/:addressId/default", requireAuth, async (req, res) => {
  try {
    const resolvedUser = req.user;

    const { addressId } = req.params;
    const idx = getAddressIndexById(resolvedUser.addresses, addressId);
    if (idx === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    resolvedUser.addresses = resolvedUser.addresses.map((item, index) => ({
      ...normalizeExistingAddress(item),
      isDefault: index === idx
    }));

    await resolvedUser.save();
    res.json({ message: "Default address updated", user: getSafeUser(resolvedUser) });
  } catch (error) {
    console.error("Failed to set default address:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
});

router.delete("/profile/address/:addressId", requireAuth, async (req, res) => {
  try {
    const resolvedUser = req.user;

    const { addressId } = req.params;
    const idx = getAddressIndexById(resolvedUser.addresses, addressId);
    if (idx === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    resolvedUser.addresses.splice(idx, 1);
    resolvedUser.addresses = ensureSingleDefaultAddress(resolvedUser.addresses);
    await resolvedUser.save();

    res.json({ message: "Address deleted", user: getSafeUser(resolvedUser) });
  } catch (error) {
    console.error("Failed to delete address:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
});

module.exports = router;
