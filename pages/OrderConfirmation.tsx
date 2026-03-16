import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import api from "../src/services/api";
import digitalSign from "../digital_sign.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  PackageCheck,
  ReceiptText
} from "lucide-react";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  discountPercentage?: number;
  image?: string;
};

type TrackingStep = {
  title: string;
  completed: boolean;
  date?: string;
};

type OrderData = {
  orderNumber: string;
  userEmail: string;
  phone?: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  subtotal: number;
  discount: number;
  taxableAmount?: number;
  gstRate?: number;
  gstAmount?: number;
  shipping: number;
  address: string;
  items: OrderItem[];
  trackingSteps: TrackingStep[];
};
const GST_RATE = 5;

const DEMO_ORDER: OrderData = {
  orderNumber: "HF-2026-123456",
  userEmail: "pragnasya2835@gmail.com",
  phone: "919876543210",
  createdAt: new Date().toISOString(),
  paymentMethod: "razorpay",
  paymentStatus: "paid",
  orderStatus: "placed",
  totalAmount: 1360,
  subtotal: 1360,
  discount: 240,
  taxableAmount: 1295.24,
  gstRate: 5,
  gstAmount: 64.76,
  shipping: 0,
  address: "B-504, Accurate Wind Chimes, Narsingi, Hyderabad - 500089",
  items: [
    {
      name: "ProLatte Protein powder",
      quantity: 2,
      price: 800,
      discountPercentage: 15,
      image: "/img1.png"
    }
  ],
  trackingSteps: [
    { title: "Order Placed", completed: true, date: new Date().toLocaleString() },
    { title: "Order Confirmed", completed: true, date: new Date().toLocaleString() },
    { title: "Shipped", completed: false },
    { title: "Out for Delivery", completed: false },
    { title: "Delivered", completed: false }
  ]
};

const getDiscountedPrice = (item: OrderItem) => {
  const discount = Number(item.discountPercentage || 0);
  if (discount <= 0) return Number(item.price || 0);
  return Math.round(Number(item.price || 0) - (Number(item.price || 0) * discount) / 100);
};

const formatAmount = (value: number, fractionDigits = 0) =>
  `Rs ${Number(value || 0).toFixed(fractionDigits)}`;
const formatRupee = (value: number) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const toWordsBelow1000 = (num: number): string => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "";
  if (num < 20) return ones[num];
  if (num < 100) return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ""}`;
  return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${toWordsBelow1000(num % 100)}` : ""}`;
};

const numberToWordsINR = (amount: number) => {
  const safe = Math.max(0, Number(amount || 0));
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundredPart = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${toWordsBelow1000(crore)} Crore`);
  if (lakh) parts.push(`${toWordsBelow1000(lakh)} Lakh`);
  if (thousand) parts.push(`${toWordsBelow1000(thousand)} Thousand`);
  if (hundredPart) parts.push(toWordsBelow1000(hundredPart));

  const rupeesWords = parts.length ? parts.join(" ") : "Zero";
  if (!paise) return `${rupeesWords} Rupees Only`;
  return `${rupeesWords} Rupees and ${toWordsBelow1000(paise)} Paise`;
};

const loadImageAsDataUrl = (src: string): Promise<string | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });

const OrderConfirmation: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const isDemoMode = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return (
      location.pathname === "/confirmation-preview" ||
      id === "preview" ||
      searchParams.get("demo") === "1"
    );
  }, [location.pathname, location.search, id]);

  useEffect(() => {
    if (isDemoMode) {
      setOrder(DEMO_ORDER);
      setLoadError("");
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
      } catch (error) {
        setLoadError("We could not load your order details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
    fetchOrder();
    } else {
      setLoadError("Order id is missing.");
      setIsLoading(false);
    }
  }, [id, isDemoMode]);

  const paymentTypeLabel = useMemo(() => {
    if (!order?.paymentMethod) return "Online Payment";
    if (order.paymentMethod === "razorpay") return "Razorpay";
    return String(order.paymentMethod);
  }, [order]);

  const placedDate = useMemo(() => {
    if (!order?.createdAt) return "Just now";
    const created = new Date(order.createdAt);
    if (Number.isNaN(created.getTime())) return "Just now";
    return created.toLocaleString();
  }, [order]);

  const estimatedDeliveryDate = useMemo(() => {
    if (!order?.createdAt) return "In 7 business days";
    const created = new Date(order.createdAt);
    if (Number.isNaN(created.getTime())) return "In 7 business days";
    const eta = new Date(created);
    eta.setDate(eta.getDate() + 7);
    return eta.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }, [order]);

  const gstRate = Number(order?.gstRate || GST_RATE);
  const gstAmount = Number(
    order?.gstAmount ?? Number(order?.subtotal || 0) * (gstRate / (100 + gstRate))
  );
  const taxableAmount = Number(
    order?.taxableAmount ?? Number(order?.subtotal || 0) - gstAmount
  );

  const handleDownloadInvoice = async () => {
    if (!order) return;
    const orderRef = order.orderNumber ?? (order as any)._id ?? id ?? "order";
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const outerW = 540;
    const outerX = (pageWidth - outerW) / 2;
    const halfW = outerW / 2;
    const hsnCode = "210610";
    const halfGstRate = gstRate / 2;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    const totalQty = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB");
    const amountInWords = numberToWordsINR(Number(order.totalAmount || 0));

    doc.setLineWidth(0.8);
    doc.setDrawColor(30, 41, 59);

    // Top title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TAX INVOICE", outerX, 22);
    doc.setDrawColor(107, 114, 128);
    doc.rect(116, 10, 64, 22);
    doc.setFontSize(10);
    doc.text("ORIGINAL", 124, 24);
    doc.setDrawColor(30, 41, 59);

    // Header container
    const headerY = 34;
    const headerH = 118;
    doc.rect(outerX, headerY, outerW, headerH);
    doc.line(outerX + halfW, headerY, outerX + halfW, headerY + headerH);

    const logoDataUrl = await loadImageAsDataUrl("/logo.png");
    const signDataUrl = await loadImageAsDataUrl(digitalSign);
    if (logoDataUrl) {
      // Keep logo proportions closer to the website header for a cleaner look.
      doc.addImage(logoDataUrl, "PNG", outerX + 16, headerY + 22, 126, 42);
    }

    // Left half: logo + invoice number only
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text(`Invoice No: ${String(orderRef)}`, outerX + 16, headerY + 100);

    // Right half: address + invoice date only
    const rightBlockX = outerX + halfW + 14;
    const rightBlockW = halfW - 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Address", rightBlockX, headerY + 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Bendoorwell, Bendoor, Mangaluru, Karnataka,", rightBlockX, headerY + 50, {
      maxWidth: rightBlockW
    });
    doc.text("Mangaluru, Dakshina Kannada", rightBlockX, headerY + 63, {
      maxWidth: rightBlockW
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Invoice Date: ${invoiceDate}`, rightBlockX, headerY + 92);

    // Bill / Ship section
    const partyY = headerY + headerH;
    const partyH = 106;
    doc.rect(outerX, partyY, outerW, partyH);
    doc.line(outerX + halfW, partyY, outerX + halfW, partyY + partyH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BILL TO", outerX + 8, partyY + 18);
    doc.text("SHIP TO", outerX + halfW + 8, partyY + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(order.userEmail, outerX + 8, partyY + 36);
    doc.text(order.userEmail, outerX + halfW + 8, partyY + 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Address: ${order.address}`, outerX + 8, partyY + 52, { maxWidth: halfW - 16 });
    doc.text(`Address: ${order.address}`, outerX + halfW + 8, partyY + 52, { maxWidth: halfW - 16 });
    doc.text(`Phone: ${order.phone ? `+91 ${order.phone}` : "-"}`, outerX + 8, partyY + 78);
    doc.text(`Phone: ${order.phone ? `+91 ${order.phone}` : "-"}`, outerX + halfW + 8, partyY + 78);
    doc.text(`Estimated Delivery: ${estimatedDeliveryDate}`, outerX + 8, partyY + 92);
    doc.text(`Payment: ${paymentTypeLabel} (${order.paymentStatus})`, outerX + halfW + 8, partyY + 92);

    // Items table
    const itemRows = order.items.map((item, idx) => {
      const qty = Number(item.quantity || 0);
      const rateIncl = getDiscountedPrice(item);
      // Calculate amount WITHOUT GST for the AMOUNT column
      const amountExclGST = (rateIncl * qty) / (1 + gstRate / 100);
      return [
        String(idx + 1),
        item.name,
        hsnCode,
        `${qty} JAR`,
        Number(rateIncl).toLocaleString("en-IN"),
        formatRupee(amountExclGST)
      ];
    });

    itemRows.push([
      "",
      `CGST @${halfGstRate.toFixed(1)}%`,
      "-",
      "-",
      "-",
      formatRupee(cgstAmount)
    ]);
    itemRows.push([
      "",
      `SGST @${halfGstRate.toFixed(1)}%`,
      "-",
      "-",
      "-",
      formatRupee(sgstAmount)
    ]);
    itemRows.push([
      "",
      "TOTAL",
      "",
      String(totalQty),
      "",
      formatRupee(Number(order.totalAmount || 0))
    ]);

    autoTable(doc, {
      startY: partyY + partyH,
      head: [["S.NO.", "ITEMS", "HSN", "QTY.", "RATE", "AMOUNT"]],
      body: itemRows,
      theme: "grid",
      headStyles: {
        fillColor: [190, 220, 240],
        textColor: [17, 24, 39],
        fontStyle: "bold",
        halign: "center",
        lineColor: [30, 41, 59],
        lineWidth: 0.8
      },
      styles: {
        fontSize: 10,
        lineColor: [30, 41, 59],
        lineWidth: 0.8,
        textColor: [17, 24, 39],
        cellPadding: { top: 6, right: 10, bottom: 6, left: 6 },
        valign: "middle",
        halign: "left"
      },
      bodyStyles: {
        minCellHeight: 22
      },
      didParseCell: (data: any) => {
        if (data.section !== "body") return;

        // Keep numeric area consistently aligned.
        if ([4, 5].includes(data.column.index)) {
          data.cell.styles.halign = "right";
        }
        if ([2, 3].includes(data.column.index)) {
          data.cell.styles.halign = "center";
        }

        // Highlight total row for better visual alignment and readability.
        const isTotalRow = String(data.row?.raw?.[1] || "").trim().toUpperCase() === "TOTAL";
        if (isTotalRow && [1, 5].includes(data.column.index)) {
          data.cell.styles.fontStyle = "bold";
        }
      },
      columnStyles: {
        0: { cellWidth: 58, halign: "center" },
        1: { cellWidth: 186 },
        2: { cellWidth: 72, halign: "right" },
        3: { cellWidth: 60, halign: "right" },
        4: { cellWidth: 58, halign: "right" },
        5: { cellWidth: 84, halign: "right" }
      },
      margin: { left: outerX, right: outerX }
    });

    const tableEndY = (doc as any).lastAutoTable?.finalY || 420;

    // Amount in words
    const wordsY = tableEndY + 8;
    doc.rect(outerX, wordsY, outerW, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Total Amount (in words)", outerX + 8, wordsY + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(amountInWords, outerX + 8, wordsY + 29);

    // Bottom footer blocks (no bank/QR as requested)
    const bottomY = wordsY + 36;
    const boxH = 74;
    doc.rect(outerX, bottomY, outerW, boxH);
    doc.line(outerX + halfW, bottomY, outerX + halfW, bottomY + boxH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Terms and Conditions", outerX + 8, bottomY + 18);
    doc.setFont("helvetica", "normal");
    doc.text("1. Goods once sold will not be taken back or exchanged.", outerX + 8, bottomY + 36);

    const signWidth = 146;
    const signX = outerX + outerW - signWidth - 14;
    if (signDataUrl) {
      doc.addImage(signDataUrl, "JPEG", signX, bottomY + 8, signWidth, 24);
    }
    doc.setFont("helvetica", "normal");
    doc.text("Authorised Signatory For", outerX + outerW - 14, bottomY + 52, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text("HealthFirst Life Sciences", outerX + outerW - 14, bottomY + 66, { align: "right" });

    doc.save(`${orderRef}-invoice.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
          <h1 className="text-2xl font-black text-rose-700">Unable to load order</h1>
          <p className="mt-3 text-sm text-rose-600">{loadError || "Order not found."}</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center rounded-xl bg-[#0369a1] px-5 py-3 text-sm font-bold text-white"
          >
            Continue Shopping
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-14 px-4">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-4">
              <CheckCircle2 size={48} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Payment Complete
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">Thank you for your order!</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Your payment was successful and we have received your order. A confirmation has been
              sent to <span className="font-bold text-slate-800">{order.userEmail}</span>.
            </p>
            {order.phone && (
              <p className="mt-1 text-sm text-slate-600">
                Delivery contact: <span className="font-bold text-slate-800">+{order.phone}</span>
              </p>
            )}
            {isDemoMode && (
              <p className="mt-3 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                Preview Mode - Dummy Data
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleDownloadInvoice()}
              className="mt-5 inline-flex items-center rounded-xl border border-[#0369a1] px-6 py-3 text-sm font-bold text-[#0369a1] hover:bg-sky-50"
            >
              Download Invoice (PDF)
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-5 text-xl font-black text-slate-900">Order Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center text-slate-500">
                  <ReceiptText size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wide">Order Ref</span>
                </div>
                <p className="text-lg font-black text-[#0369a1]">{order.orderNumber}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center text-slate-500">
                  <CalendarDays size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wide">Order Date</span>
                </div>
                <p className="text-sm font-bold text-slate-800">{placedDate}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center text-slate-500">
                  <CreditCard size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wide">Payment Type</span>
                </div>
                <p className="text-sm font-bold capitalize text-slate-800">{paymentTypeLabel}</p>
                <p className="mt-1 text-xs text-emerald-700">Status: {order.paymentStatus}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center text-slate-500">
                  <PackageCheck size={16} className="mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wide">Order Status</span>
                </div>
                <p className="text-sm font-bold capitalize text-slate-800">{order.orderStatus}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {formatAmount(order.totalAmount)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center text-slate-500">
                <MapPin size={16} className="mr-2" />
                <span className="text-xs font-bold uppercase tracking-wide">Delivery Address</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{order.address}</p>
              {order.phone && (
                <p className="mt-2 text-sm font-semibold text-slate-700">Contact: +91 {order.phone}</p>
              )}
        </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center text-slate-500">
                <CalendarDays size={16} className="mr-2" />
                <span className="text-xs font-bold uppercase tracking-wide">Estimated Delivery</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{estimatedDeliveryDate}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <h3 className="mb-4 text-base font-black text-slate-900">Ordered Items</h3>
              <div className="space-y-3">
                {(order.items || []).map((item, index) => {
                  const discountedPrice = getDiscountedPrice(item);
                  const lineTotal = discountedPrice * Number(item.quantity || 0);
                  const imageSrc = item.image && item.image.trim().length > 0 ? item.image : "/img1.png";

                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-lg bg-white">
                          <img
                            src={imageSrc}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            Qty: {item.quantity} x {formatAmount(discountedPrice, 2)}
                          </p>
                          <p className="text-[11px] text-slate-400">Price includes GST @ {gstRate}%</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatAmount(lineTotal, 2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-900">Tracking</h2>
            <div className="space-y-4">
              {(order.trackingSteps || []).map((step, i) => (
                <div key={i} className="relative flex items-start">
                  <div
                    className={`mt-1 h-4 w-4 rounded-full border-2 ${
                      step.completed
                        ? "border-emerald-600 bg-emerald-500"
                        : "border-slate-300 bg-white"
                  }`}
                />
                  {i < (order.trackingSteps || []).length - 1 && (
                    <div className="absolute left-[7px] top-6 h-8 w-[2px] bg-slate-200" />
                  )}
                  <div className="ml-3">
                    <p
                      className={`text-sm font-bold ${
                        step.completed ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.completed && step.date && (
                      <p className="text-xs text-slate-500">{step.date}</p>
                    )}
                  </div>
                </div>
              ))}
              </div>
          </div>
        </section>

        <section className="flex flex-col items-center justify-between gap-4 rounded-3xl border bg-white p-6 shadow-sm sm:flex-row">
          <p className="text-sm text-slate-600">
            Need help with your order? Reach us from your profile order history.
          </p>
          <div className="flex items-center gap-3">
        <Link
          to="/profile"
              className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              View Orders
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center rounded-xl bg-[#0369a1] px-5 py-3 text-sm font-bold text-white"
            >
              Continue Shopping
              <ArrowRight size={16} className="ml-2" />
        </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrderConfirmation;