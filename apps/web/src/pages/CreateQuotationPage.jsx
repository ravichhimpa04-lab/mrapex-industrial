import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function getFinancialYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const startYear = month >= 4 ? year : year - 1;
  const endYear = String(startYear + 1).slice(-2);

  return `${startYear}-${endYear}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function CreateQuotationPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [quotationNo, setQuotationNo] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    company_name: '',
    mobile: '',
    email: '',
    address: '',
    quotation_date: todayDate(),
    valid_until: addDays(30),
    gst_percent: 18,
    discount_amount: 0,
    freight_amount: 0,
    terms: '30% advance with Purchase Order, balance before dispatch.',
    notes: '',
  });

  const [items, setItems] = useState([
    {
      product_name: '',
      part_number: '',
      make: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    },
  ]);

  async function generateQuotationNo() {
    const fy = getFinancialYear();

    const { data, error } = await supabase
      .from('quotations')
      .select('quotation_no')
      .like('quotation_no', `Apex/${fy}/%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
      setQuotationNo(`Apex/${fy}/1000`);
      return;
    }

    if (!data || data.length === 0) {
      setQuotationNo(`Apex/${fy}/1000`);
      return;
    }

    const lastNo = data[0].quotation_no;
    const lastNumber = Number(lastNo.split('/').pop() || 999);
    setQuotationNo(`Apex/${fy}/${lastNumber + 1}`);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      alert('Products load nahi hue');
    } else {
      setProducts(data || []);
    }
  }

  useEffect(() => {
    generateQuotationNo();
    fetchProducts();
  }, []);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index, key, value) {
    const next = [...items];
    next[index][key] = value;

    const qty = Number(next[index].quantity || 0);
    const rate = Number(next[index].rate || 0);
    next[index].amount = qty * rate;

    setItems(next);
  }

  function selectProduct(index, productId) {
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return;

    const next = [...items];

    next[index] = {
      ...next[index],
      product_name: product.name || product.product_name || '',
      part_number: product.part_no || product.part_number || '',
      make: product.make || '',
      description: product.description || '',
      quantity: next[index].quantity || 1,
      rate: next[index].rate || 0,
      amount: Number(next[index].quantity || 1) * Number(next[index].rate || 0),
    };

    setItems(next);
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        product_name: '',
        part_number: '',
        make: '',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  }

  function removeItem(index) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [items]);

  const gstAmount = useMemo(() => {
    const taxable =
      subtotal -
      Number(form.discount_amount || 0) +
      Number(form.freight_amount || 0);

    return (taxable * Number(form.gst_percent || 0)) / 100;
  }, [subtotal, form]);

  const grandTotal = useMemo(() => {
    return (
      subtotal -
      Number(form.discount_amount || 0) +
      Number(form.freight_amount || 0) +
      gstAmount
    );
  }, [subtotal, form, gstAmount]);

  async function saveQuotation() {
    if (!form.customer_name || !form.company_name || !form.mobile) {
      alert('Customer name, company name aur mobile required hai');
      return;
    }

    const validItems = items.filter((item) => item.product_name && item.quantity);

    if (validItems.length === 0) {
      alert('Kam se kam ek product add karo');
      return;
    }

    setSaving(true);

    const quotationPayload = {
      quotation_no: quotationNo,
      customer_name: form.customer_name,
      company_name: form.company_name,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      quotation_date: form.quotation_date,
      valid_until: form.valid_until,
      gst_percent: Number(form.gst_percent || 0),
      discount_amount: Number(form.discount_amount || 0),
      freight_amount: Number(form.freight_amount || 0),
      subtotal: Number(subtotal || 0),
      gst_amount: Number(gstAmount || 0),
      grand_total: Number(grandTotal || 0),
      terms: form.terms,
      notes: form.notes,
      status: 'Draft',
      customer_email_sent: false,
    };

    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .insert([quotationPayload])
      .select()
      .single();

    if (quotationError) {
      console.error(quotationError);
      alert('Quotation save nahi hui');
      setSaving(false);
      return;
    }

    const itemPayload = validItems.map((item) => ({
      quotation_id: quotation.id,
      product_name: item.product_name,
      part_number: item.part_number,
      make: item.make,
      description: item.description,
      quantity: Number(item.quantity || 0),
      rate: Number(item.rate || 0),
      amount: Number(item.amount || 0),
    }));

    const { error: itemError } = await supabase
      .from('quotation_items')
      .insert(itemPayload);

    if (itemError) {
      console.error(itemError);
      alert('Quotation bani, lekin items save nahi hue');
      setSaving(false);
      return;
    }

    alert('Quotation Draft save ho gayi');
    navigate('/admin/quotations');
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Create Quotation</h1>
            <p className="text-slate-500">{quotationNo}</p>
          </div>

          <Link to="/admin/quotations" className="text-blue-600">
            ← Back
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input label="Customer Name" value={form.customer_name} onChange={(v) => updateForm('customer_name', v)} />
          <Input label="Company Name" value={form.company_name} onChange={(v) => updateForm('company_name', v)} />
          <Input label="Mobile" value={form.mobile} onChange={(v) => updateForm('mobile', v)} />
          <Input label="Email" value={form.email} onChange={(v) => updateForm('email', v)} />
          <Input label="Address" value={form.address} onChange={(v) => updateForm('address', v)} />
          <Input label="Quotation Date" type="date" value={form.quotation_date} onChange={(v) => updateForm('quotation_date', v)} />
          <Input label="Valid Until" type="date" value={form.valid_until} onChange={(v) => updateForm('valid_until', v)} />
        </div>

        <h2 className="text-xl font-bold mb-3">Products</h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Select Product</label>
                  <select
                    className="w-full border rounded p-2 mt-1"
                    onChange={(e) => selectProduct(index, e.target.value)}
                  >
                    <option value="">Select</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input label="Product Name" value={item.product_name} onChange={(v) => updateItem(index, 'product_name', v)} />
                <Input label="Part No" value={item.part_number} onChange={(v) => updateItem(index, 'part_number', v)} />
                <Input label="Make" value={item.make} onChange={(v) => updateItem(index, 'make', v)} />
                <Input label="Qty" type="number" value={item.quantity} onChange={(v) => updateItem(index, 'quantity', v)} />
                <Input label="Rate" type="number" value={item.rate} onChange={(v) => updateItem(index, 'rate', v)} />
                <Input label="Amount" type="number" value={item.amount} onChange={(v) => updateItem(index, 'amount', v)} />
              </div>

              <div className="mt-3">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full border rounded p-2 mt-1"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
              </div>

              <button
                onClick={() => removeItem(index)}
                className="mt-3 text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-4 px-4 py-2 bg-slate-200 rounded"
        >
          + Add Product
        </button>

        <h2 className="text-xl font-bold mt-8 mb-3">Commercial</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Discount Amount" type="number" value={form.discount_amount} onChange={(v) => updateForm('discount_amount', v)} />
          <Input label="Freight Amount" type="number" value={form.freight_amount} onChange={(v) => updateForm('freight_amount', v)} />
          <Input label="GST %" type="number" value={form.gst_percent} onChange={(v) => updateForm('gst_percent', v)} />
        </div>

        <div className="mt-6 bg-slate-900 text-white rounded-lg p-5 max-w-md ml-auto">
          <p>Subtotal: ₹ {subtotal.toLocaleString('en-IN')}</p>
          <p>GST: ₹ {gstAmount.toLocaleString('en-IN')}</p>
          <p className="text-xl font-bold mt-2">
            Grand Total: ₹ {grandTotal.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium">Terms</label>
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows="3"
            value={form.terms}
            onChange={(e) => updateForm('terms', e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows="3"
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
          />
        </div>

        <button
          onClick={saveQuotation}
          disabled={saving}
          className="mt-6 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Draft Quotation'}
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        className="w-full border rounded p-2 mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default CreateQuotationPage;