import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function QuotationDetailPage() {
  const { id } = useParams();

  const [quotation, setQuotation] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  async function fetchQuotation() {
    setLoading(true);

    const { data: qData, error: qError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (qError) {
      alert(qError.message);
      setLoading(false);
      return;
    }

    const { data: itemData, error: itemError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('created_at', { ascending: true });

    if (itemError) {
      alert(itemError.message);
      setLoading(false);
      return;
    }

    setQuotation(qData);
    setItems(itemData || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  async function getToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token;
  }

  async function generatePDF() {
    if (!quotation) return;

    try {
      const token = await getToken();

      if (!token) {
        alert('Please login again.');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/quotations/${quotation.id}/pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'PDF generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.quotation_no.replaceAll('/', '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || 'PDF generation failed');
    }
  }

  async function sendQuotationEmail() {
    if (!quotation) return;

    if (!quotation.email) {
      alert('Customer email is missing in this quotation.');
      return;
    }

    const ok = window.confirm(
      `Send quotation ${quotation.quotation_no} to ${quotation.email}?`
    );

    if (!ok) return;

    try {
      setSendingEmail(true);

      const token = await getToken();

      if (!token) {
        alert('Please login again.');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/quotations/${quotation.id}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Quotation email send failed');
      }

      alert(`Quotation email sent successfully to ${data.sent_to || quotation.email}`);
      await fetchQuotation();
    } catch (error) {
      alert(error.message || 'Quotation email send failed');
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading quotation...</div>;
  }

  if (!quotation) {
    return <div className="p-6">Quotation not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {quotation.quotation_no}
            </h1>
            <p className="text-slate-500">{quotation.company_name}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={generatePDF}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900"
            >
              Generate PDF
            </button>

            <button
              onClick={sendQuotationEmail}
              disabled={sendingEmail}
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-60"
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>

            <Link
              to="/admin/quotations"
              className="px-4 py-2 border rounded-lg hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Box title="Customer Details">
            <p><b>Name:</b> {quotation.customer_name}</p>
            <p><b>Company:</b> {quotation.company_name}</p>
            <p><b>Mobile:</b> {quotation.mobile}</p>
            <p><b>Email:</b> {quotation.email}</p>
            <p><b>Address:</b> {quotation.address}</p>
          </Box>

          <Box title="Quotation Details">
            <p><b>Date:</b> {quotation.quotation_date}</p>
            <p><b>Valid Until:</b> {quotation.valid_until}</p>
            <p><b>Status:</b> {quotation.status || 'Draft'}</p>
          </Box>
        </div>

        <div className="overflow-x-auto border rounded-xl mb-6">
          <table className="w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="p-3 text-left">Sr</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Part No</th>
                <th className="p-3 text-left">Make</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">
                    <b>{item.product_name}</b>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </td>
                  <td className="p-3">{item.part_number}</td>
                  <td className="p-3">{item.make}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">{money(item.rate)}</td>
                  <td className="p-3 text-right">{money(item.amount)}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="max-w-sm ml-auto bg-blue-800 text-white rounded-xl p-5">
          <p>Subtotal: {money(quotation.subtotal)}</p>
          <p>Discount: {money(quotation.discount_amount)}</p>
          <p>Freight: {money(quotation.freight_amount)}</p>
          <p>GST: {money(quotation.gst_amount)}</p>
          <p className="text-xl font-bold mt-2">
            Grand Total: {money(quotation.grand_total)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Box({ title, children }) {
  return (
    <div className="border rounded-xl p-4 bg-slate-50">
      <h2 className="font-bold mb-2">{title}</h2>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}

export default QuotationDetailPage;