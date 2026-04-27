"use client";

import { Printer } from "lucide-react";

interface OrderItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sizeName?: string | null;
  extras?: string | null;
}

interface PrintableOrder {
  orderNumber: number;
  customerName: string;
  customerPhone?: string | null;
  orderType: string;
  tableName?: string;
  status: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  restaurantName: string;
}

export function PrintOrderButton({ order }: { order: PrintableOrder }) {
  const handlePrint = () => {
    const orderTypeLabels: Record<string, string> = {
      DINE_IN: "طاولة",
      TAKEAWAY: "سفري",
      DELIVERY: "توصيل",
    };

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طلب #${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            max-width: 80mm;
            margin: 0 auto;
            padding: 8mm;
            font-size: 12px;
            color: #111;
          }
          .header {
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 2px dashed #333;
            margin-bottom: 10px;
          }
          .header h1 {
            font-size: 16px;
            font-weight: 900;
            margin-bottom: 4px;
          }
          .header p { font-size: 11px; color: #555; }
          .info {
            padding: 8px 0;
            border-bottom: 1px dashed #ccc;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 11px;
          }
          .info-row strong { font-weight: 700; }
          .items {
            padding: 8px 0;
            border-bottom: 1px dashed #ccc;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 12px;
          }
          .item-name {
            flex: 1;
            font-weight: 600;
          }
          .item-details {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
          .totals {
            padding: 8px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 12px;
          }
          .total-row.grand {
            font-size: 16px;
            font-weight: 900;
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 4px;
          }
          .footer {
            text-align: center;
            padding-top: 12px;
            border-top: 2px dashed #333;
            font-size: 10px;
            color: #999;
          }
          .notes {
            background: #f9f9f9;
            padding: 6px 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 11px;
            border: 1px solid #eee;
          }
          @media print {
            body { max-width: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${order.restaurantName}</h1>
          <p>طلب رقم #${order.orderNumber}</p>
        </div>

        <div class="info">
          <div class="info-row"><span>العميل:</span><strong>${order.customerName}</strong></div>
          ${order.customerPhone ? `<div class="info-row"><span>الهاتف:</span><strong>${order.customerPhone}</strong></div>` : ""}
          <div class="info-row"><span>النوع:</span><strong>${orderTypeLabels[order.orderType] || order.orderType}</strong></div>
          ${order.tableName ? `<div class="info-row"><span>الطاولة:</span><strong>${order.tableName}</strong></div>` : ""}
          <div class="info-row"><span>التاريخ:</span><strong>${new Date(order.createdAt).toLocaleString("ar-SA")}</strong></div>
        </div>

        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <div>
                <div class="item-name">${item.quantity}× ${item.itemName}</div>
                ${item.sizeName ? `<div class="item-details">الحجم: ${item.sizeName}</div>` : ""}
                ${item.extras ? `<div class="item-details">إضافات: ${item.extras}</div>` : ""}
              </div>
              <strong>${item.totalPrice.toFixed(2)}</strong>
            </div>
          `).join("")}
        </div>

        ${order.notes ? `<div class="notes">📝 ${order.notes}</div>` : ""}

        <div class="totals">
          <div class="total-row"><span>المجموع الفرعي:</span><span>${order.subtotal.toFixed(2)}</span></div>
          ${order.tax > 0 ? `<div class="total-row"><span>الضريبة:</span><span>${order.tax.toFixed(2)}</span></div>` : ""}
          ${order.serviceCharge > 0 ? `<div class="total-row"><span>رسوم الخدمة:</span><span>${order.serviceCharge.toFixed(2)}</span></div>` : ""}
          <div class="total-row grand"><span>الإجمالي:</span><span>${order.total.toFixed(2)} د.أ</span></div>
        </div>

        <div class="footer">
          <p>شكراً لزيارتكم 🙏</p>
          <p style="margin-top:4px">Powered by MenuPro</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=350,height=600");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1"
      style={{
        padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)",
        background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#374151",
      }}
      title="طباعة الطلب"
    >
      <Printer style={{ width: 14, height: 14 }} /> طباعة
    </button>
  );
}
