const nodemailer = require("nodemailer");

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

const getEstimatedDeliveryDate = (orderDate) => {
  const base = orderDate ? new Date(orderDate) : new Date();
  if (Number.isNaN(base.getTime())) return "In 7 business days";
  const eta = new Date(base);
  eta.setDate(eta.getDate() + 7);
  return eta.toDateString();
};

const sendOrderConfirmationEmail = async (order) => {
  const transporter = createEmailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transporter || !fromAddress) {
    console.log("Order email skipped: SMTP is not configured.");
    return;
  }

  const itemsHtml = (order.items || [])
    .map((item) => {
      const qty = Number(item.quantity || 0);
      const basePrice = Number(item.price || 0);
      const discount = Number(item.discountPercentage || 0);
      const discounted =
        discount > 0 ? Math.round(basePrice - (basePrice * discount) / 100) : basePrice;
      const lineTotal = discounted * qty;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.name || "Item"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${qty}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs ${discounted.toFixed(0)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">Rs ${lineTotal.toFixed(0)}</td>
      </tr>`;
    })
    .join("");

  const subject = `Order Confirmed - ${order.orderNumber || "HealthFirst"}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 8px;">Payment Successful</h2>
      <p style="margin:0 0 16px;">Thank you for shopping with HealthFirst Life Sciences.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;"><strong>Order Ref:</strong> ${order.orderNumber || "-"}</p>
        <p style="margin:0 0 8px;"><strong>Order Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
        <p style="margin:0 0 8px;"><strong>Estimated Delivery:</strong> ${getEstimatedDeliveryDate(order.createdAt)}</p>
        <p style="margin:0 0 8px;"><strong>Payment:</strong> ${order.paymentMethod || "online"} (${order.paymentStatus || "paid"})</p>
        <p style="margin:0 0 8px;"><strong>Contact Number:</strong> ${order.phone ? `+91 ${order.phone}` : "-"}</p>
        <p style="margin:0;"><strong>Shipping Address:</strong> ${order.address || "-"}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <thead style="background:#f1f5f9;">
          <tr>
            <th style="padding:10px;text-align:left;">Item</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Price</th>
            <th style="padding:10px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top:16px;text-align:right;">
        <p style="margin:0 0 6px;"><strong>Taxable Value:</strong> Rs ${Number(order.taxableAmount || 0).toFixed(2)}</p>
        <p style="margin:0 0 6px;"><strong>GST (5%, included):</strong> Rs ${Number(order.gstAmount || 0).toFixed(2)}</p>
        <p style="margin:0 0 6px;"><strong>Subtotal:</strong> Rs ${Number(order.subtotal || 0).toFixed(0)}</p>
        <p style="margin:0 0 6px;"><strong>Shipping:</strong> ${Number(order.shipping || 0) === 0 ? "FREE" : `Rs ${Number(order.shipping).toFixed(0)}`}</p>
        <p style="margin:0;font-size:18px;font-weight:800;color:#0369a1;">Order Total: Rs ${Number(order.totalAmount || 0).toFixed(0)}</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress,
    to: order.userEmail,
    subject,
    html
  });
};

module.exports = {
  sendOrderConfirmationEmail,
  getEstimatedDeliveryDate
};
