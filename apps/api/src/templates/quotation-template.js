import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function escapeHtml(value = '') {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(amount) {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function number(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function amountWords(amount) {
  return `Rupees ${Math.round(Number(amount || 0)).toLocaleString('en-IN')} Only`;
}

function getTemplatePath() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.join(__dirname, 'mrapex-quotation-template.html');
}

function buildItemsRows(items = [], quotation = {}) {
  if (!items.length) {
    return `<tr><td class="center-cell" colspan="10">No items found</td></tr>`;
  }

  return items.map((item, index) => `
    <tr>
      <td class="center-cell">${index + 1}</td>
      <td>
        <span class="it-desc">${escapeHtml(item.product_name || '')}</span>
        <span class="it-sub">Part No: ${escapeHtml(item.part_number || '-')} &nbsp;|&nbsp; OEM No: ${escapeHtml(item.oem_no || '-')}</span>
      </td>
      <td>${escapeHtml(item.make || '-')}<br><span class="it-sub" style="margin-top:0">${escapeHtml(item.origin || '')}</span></td>
      <td class="mono">${escapeHtml(item.hsn || '-')}</td>
      <td class="num-cell">${escapeHtml(item.quantity || 0)}</td>
      <td class="center-cell">${escapeHtml(item.unit || 'PCS')}</td>
      <td class="num-cell mono">${number(item.rate)}</td>
      <td class="num-cell">${escapeHtml(item.discount_percent || 0)}%</td>
      <td class="num-cell">${escapeHtml(item.gst_percent || quotation.gst_percent || 18)}%</td>
      <td class="amt-cell">${number(item.amount)}</td>
    </tr>
  `).join('');
}

export function buildQuotationHTML(quotation = {}, items = []) {
  let html = fs.readFileSync(getTemplatePath(), 'utf8');

  const quotationNo = quotation.quotation_no || 'Apex/2026-27/1000';

  html = html.replaceAll('Apex/2026-27/1000', escapeHtml(quotationNo));
  html = html.replaceAll('{{quotation_no}}', escapeHtml(quotationNo));

  html = html.replaceAll('20 Jun 2026', escapeHtml(formatDate(quotation.quotation_date)));
  html = html.replaceAll('20 Jul 2026', escapeHtml(formatDate(quotation.valid_until)));

  html = html.replaceAll('RFQ/SBE/0612', escapeHtml(quotation.rfq_reference || '-'));
  html = html.replaceAll('PO-ENQ/2026/118', escapeHtml(quotation.customer_reference || '-'));
  html = html.replaceAll('Priya Sharma', escapeHtml(quotation.prepared_by || 'Ravi Chhimpa'));
  html = html.replaceAll('Vikram Singh Rathore', escapeHtml(quotation.sales_executive || 'MR Apex Sales'));

  html = html.replaceAll('Shree Balaji Engineering Works Pvt. Ltd.', escapeHtml(quotation.company_name || ''));
  html = html.replaceAll('Mr. Anil Kumar Gupta', escapeHtml(quotation.customer_name || ''));
  html = html.replaceAll('Procurement Manager', escapeHtml(quotation.designation || '-'));
  html = html.replaceAll('+91 97990 55678', escapeHtml(quotation.mobile || ''));
  html = html.replaceAll('procurement@shreebalajiengg.com', escapeHtml(quotation.email || ''));

  html = html.replaceAll(
    'B-14, Malviya Industrial Area, Jaipur, Rajasthan&nbsp;302017',
    escapeHtml(quotation.address || '')
  );

  html = html.replaceAll('{{shipping_address}}', escapeHtml(quotation.shipping_address || ''));

  html = html.replace(
    /Plant 2,\s*Bhiwadi Industrial Area,\s*Alwar,\s*Rajasthan(&nbsp;|\s)301019/g,
    escapeHtml(quotation.shipping_address || '')
  );

  html = html.replaceAll('08AAFCS5678K1ZP', escapeHtml(quotation.gst_no || '-'));
  html = html.replaceAll('AAFCS5678K', escapeHtml(quotation.pan_number || '-'));
  html = html.replaceAll('CRM-2026-04521', escapeHtml(quotation.customer_ref_id || '-'));
  html = html.replaceAll('TRK-APX-118827', escapeHtml(quotation.tracking_id || '-'));

  html = html.replace(
    /<tbody>[\s\S]*?<\/tbody>/,
    `<tbody>${buildItemsRows(items, quotation)}</tbody>`
  );

  html = html.replaceAll('₹ 2,11,200.00', money(quotation.subtotal));
  html = html.replaceAll('&minus; ₹ 11,460.00', `− ${money(quotation.discount_amount)}`);
  html = html.replaceAll('₹ 1,500.00', money(quotation.packing_amount));
  html = html.replaceAll('₹ 3,200.00', money(quotation.freight_amount));
  html = html.replaceAll('₹ 800.00', money(quotation.insurance_amount));
  html = html.replaceAll('₹ 36,943.20', money(quotation.gst_amount));
  html = html.replaceAll('&minus; ₹ 0.20', money(quotation.round_off));
  html = html.replaceAll('₹ 2,42,183.00', money(quotation.grand_total));

  html = html.replaceAll(
    'Rupees Two Lakh Forty Two Thousand One Hundred Eighty Three Only',
    amountWords(quotation.grand_total)
  );

  html = html.replaceAll('HDFC Bank Ltd.', escapeHtml(quotation.bank_name || ''));
  html = html.replaceAll('50200012345678', escapeHtml(quotation.account_no || ''));
  html = html.replaceAll('HDFC0001234', escapeHtml(quotation.ifsc_code || ''));
  html = html.replaceAll('Malviya Nagar, Jaipur', escapeHtml(quotation.branch_name || ''));
  html = html.replaceAll('apexindustrial@hdfcbank', escapeHtml(quotation.upi_id || ''));

  html = html.replaceAll('{{bank_name}}', escapeHtml(quotation.bank_name || ''));
  html = html.replaceAll('{{account_no}}', escapeHtml(quotation.account_no || ''));
  html = html.replaceAll('{{ifsc_code}}', escapeHtml(quotation.ifsc_code || ''));
  html = html.replaceAll('{{branch_name}}', escapeHtml(quotation.branch_name || ''));
  html = html.replaceAll('{{upi_id}}', escapeHtml(quotation.upi_id || ''));

  return html;
}