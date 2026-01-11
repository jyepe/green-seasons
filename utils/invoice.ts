import { OrderDetailItem, EmployeeTruckLoadItem } from '@/lib/supabase';
import { COMPANY_INFO } from '@/constants/Company';

// Helper function to format date
export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return 'N/A';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to format currency
export const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`;
};

// Helper function to capitalize status
export const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to escape HTML entities to prevent XSS attacks
export const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper function to pluralize words
export const pluralize = (text: string, count: number): string => {
  return `${text}${count === 1 ? '' : 's'}`;
};

export const generateInvoiceHtml = (
  orderDetails: OrderDetailItem[],
  orderSummary: OrderDetailItem,
  statusColor: string
) => {
  if (!orderSummary) return '';

  const itemsHtml = orderDetails
    .map(
      item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.item_name)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.line_total)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${escapeHtml(orderSummary.order_id.slice(0, 8))}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 40px; 
            color: #1f2937;
            background: #fff;
          }
          .invoice-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 40px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #16a34a;
          }
          .company-name { 
            font-size: 28px; 
            font-weight: 700; 
            color: #16a34a;
            margin-bottom: 4px;
          }
          .company-tagline {
            font-size: 14px;
            color: #6b7280;
          }
          .invoice-title { 
            text-align: right;
          }
          .invoice-title h1 {
            font-size: 32px; 
            font-weight: 700; 
            color: #1f2937;
            margin-bottom: 8px;
          }
          .invoice-number {
            font-size: 16px;
            color: #6b7280;
          }
          .info-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 40px;
          }
          .info-block h3 { 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            color: #6b7280; 
            margin-bottom: 8px;
          }
          .info-block p { 
            font-size: 14px; 
            line-height: 1.6;
            color: #374151;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: ${statusColor};
            color: white;
            margin-top: 8px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
          }
          th { 
            background: #f9fafb; 
            padding: 14px 12px; 
            text-align: left; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
          }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
          th:nth-child(3), th:nth-child(4) { text-align: right; }
          td { 
            font-size: 14px;
            color: #374151;
          }
          .totals { 
            margin-left: auto;
            width: 280px;
          }
          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-row.total { 
            font-weight: 700; 
            font-size: 18px;
            border-bottom: none;
            padding-top: 16px;
            color: #1f2937;
          }
          .totals-row span:first-child {
            color: #6b7280;
          }
          .totals-row.total span:first-child {
            color: #1f2937;
          }
          .footer { 
            margin-top: 60px; 
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center; 
            color: #9ca3af;
            font-size: 12px;
          }
          .footer p { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="company-name">${COMPANY_INFO.name}</div>
            <div class="company-tagline">${COMPANY_INFO.tagline}</div>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-number">#${escapeHtml(orderSummary.order_id.slice(0, 8).toUpperCase())}</div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-block">
            <h3>Restaurant</h3>
            <p><strong>${escapeHtml(orderSummary.restaurant_name)}</strong></p>
          </div>
          <div class="info-block">
            <h3>Order Date</h3>
            <p>${formatDate(orderSummary.placed_at)}</p>
          </div>
          <div class="info-block">
            <h3>Delivery Date</h3>
            <p>${formatDate(orderSummary.delivery_at)}</p>
          </div>
          <div class="info-block">
            <h3>Status</h3>
            <span class="status-badge">${escapeHtml(formatStatus(orderSummary.order_status))}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatCurrency(orderSummary.subtotal)}</span>
          </div>
          <div class="totals-row total">
            <span>Total</span>
            <span>${formatCurrency(orderSummary.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>${COMPANY_INFO.name} - ${COMPANY_INFO.footerText}</p>
        </div>
      </body>
    </html>
  `;
};

export const generateLoadingSheetHtml = (
  truckLoadItems: EmployeeTruckLoadItem[],
  deliveryDate: Date | string,
  driverName: string = 'Maria Rodriguez'
) => {
  if (!truckLoadItems || truckLoadItems.length === 0) return '';

  // Format delivery date
  const formattedDate =
    typeof deliveryDate === 'string'
      ? formatDate(deliveryDate)
      : formatDate(deliveryDate.toISOString());

  // Extract all unique restaurants for table headers
  const allRestaurantsMap = new Map<string, string>();
  truckLoadItems.forEach((item) => {
    item.restaurants?.forEach((r) => {
      allRestaurantsMap.set(r.restaurant_id, r.restaurant_name);
    });
  });

  const sortedRestaurants = Array.from(allRestaurantsMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Generate table header columns
  const headerColumns = sortedRestaurants
    .map(
      (r) =>
        `<th style="background: #9ca3af; color: #000; font-weight: 700; padding: 12px; text-align: left; border: none; font-size: 14px;">${escapeHtml(
          r.name
        )}</th>`
    )
    .join('');

  // Generate table body rows
  const itemsHtml = truckLoadItems
    .map((item, index) => {
      const rowBackground = index % 2 === 0 ? '#f3f4f6' : '#fff';
      
      const restaurantCells = sortedRestaurants
        .map((r) => {
          const restData = item.restaurants?.find(
            (ir) => ir.restaurant_id === r.id
          );
          const cellContent = restData
            ? `${escapeHtml(item.item_name)}: ${restData.quantity}`
            : '';
            
          return `<td style="padding: 12px; font-size: 14px; color: #374151;">${cellContent}</td>`;
        })
        .join('');

      return `
        <tr style="background: ${rowBackground};">
          ${restaurantCells}
          <td style="padding: 12px; font-weight: 700; font-size: 14px; color: #1f2937;">
            ${escapeHtml(item.item_name)}: ${item.total_quantity}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Loading Sheet - ${formattedDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            color: #000;
            background: #fff;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .meta-info {
            margin-bottom: 40px;
            font-size: 14px;
            line-height: 1.6;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          th { 
            background: #9ca3af;
            color: #000;
            font-weight: 700;
            padding: 12px;
            text-align: left;
            font-size: 14px;
          }
          td { 
            padding: 12px;
            font-size: 14px;
            color: #374151;
          }
          /* Striped rows handled inline for PDF compatibility */
        </style>
      </head>
      <body>
        <h1>Green Seasons - Employee Loading List</h1>
        
        <div class="meta-info">
          <div>Date: ${formattedDate}</div>
          <br />
          <div>Driver: ${escapeHtml(driverName)}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              ${headerColumns}
              <th style="background: #9ca3af; color: #000; font-weight: 700; padding: 12px; text-align: left; border: none; font-size: 14px;">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;
};
