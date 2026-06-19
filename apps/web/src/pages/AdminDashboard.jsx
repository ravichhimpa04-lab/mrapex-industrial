import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL;

const ENQUIRY_API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const allowedCategories = [
  'Volvo Parts',
  'Pumps',
  'Valves',
  'Fittings',
  'Hose Pipes',
  'Couplings',
  'MSV Spares',
  'Other Machinery Items',
];

const enquiryStatuses = [
  'New',
  'Running',
  'Quotation Sent',
  'Completed',
  'Lost',
];

const emptyForm = {
  product_name: '',
  part_number: '',
  category: '',
  sub_category: '',
  make: '',
  description: '',
  image_url: '',
  status: 'Active',
};

const isBlank = (value) => !value || String(value).trim() === '';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [excelUploading, setExcelUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const [activeTab, setActiveTab] = useState('products');
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('all');
  const [updatingEnquiryId, setUpdatingEnquiryId] = useState(null);

  const allowedEmails =
    import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const fetchEnquiries = async () => {
    try {
      setLoadingEnquiries(true);

      const response = await fetch(`${ENQUIRY_API_URL}?type=enquiries`);
      const result = await response.json();

      if (result.success) {
        setEnquiries(result.enquiries || []);
      }
    } catch (error) {
      console.error('Fetch enquiries error:', error);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    const verifyAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/admin-login';
        return;
      }

      const email = user.email?.toLowerCase();

      const isAllowed = allowedEmails.some(
        (item) => item.trim().toLowerCase() === email
      );

      if (!isAllowed) {
        setAccessDenied(true);
        setCheckingAccess(false);
        return;
      }

      await fetchProducts();
      await fetchEnquiries();
      setCheckingAccess(false);
    };

    verifyAccess();
  }, []);

  const missingDetailsCount = products.filter(
    (item) =>
      isBlank(item.image_url) ||
      isBlank(item.part_number) ||
      isBlank(item.category) ||
      isBlank(item.sub_category) ||
      isBlank(item.make) ||
      isBlank(item.description)
  ).length;

  const summaryCards = [
    { label: 'Total Products', value: products.length },
    {
      label: 'Missing Images',
      value: products.filter((item) => isBlank(item.image_url)).length,
    },
    { label: 'Missing Details', value: missingDetailsCount },
    {
      label: 'Inactive Products',
      value: products.filter((item) => item.status === 'Inactive').length,
    },
  ];

  const enquiryCards = [
    { label: 'Total Enquiries', value: enquiries.length },
    {
      label: 'New',
      value: enquiries.filter((item) => (item.status || 'New') === 'New')
        .length,
    },
    {
      label: 'Running',
      value: enquiries.filter((item) => item.status === 'Running').length,
    },
    {
      label: 'Quotation Sent',
      value: enquiries.filter((item) => item.status === 'Quotation Sent')
        .length,
    },
    {
      label: 'Completed',
      value: enquiries.filter((item) => item.status === 'Completed').length,
    },
    {
      label: 'Lost',
      value: enquiries.filter((item) => item.status === 'Lost').length,
    },
  ];

  const baseFilteredProducts = useMemo(() => {
    if (activeFilter === 'missing_image') {
      return products.filter((item) => isBlank(item.image_url));
    }

    if (activeFilter === 'missing_part_number') {
      return products.filter((item) => isBlank(item.part_number));
    }

    if (activeFilter === 'missing_category') {
      return products.filter((item) => isBlank(item.category));
    }

    if (activeFilter === 'missing_sub_category') {
      return products.filter((item) => isBlank(item.sub_category));
    }

    if (activeFilter === 'missing_make') {
      return products.filter((item) => isBlank(item.make));
    }

    if (activeFilter === 'missing_description') {
      return products.filter((item) => isBlank(item.description));
    }

    if (activeFilter === 'inactive') {
      return products.filter((item) => item.status === 'Inactive');
    }

    return products;
  }, [products, activeFilter]);

  const filteredProducts = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    if (!text) return baseFilteredProducts;

    return baseFilteredProducts.filter((item) => {
      return (
        String(item.product_name || '').toLowerCase().includes(text) ||
        String(item.part_number || '').toLowerCase().includes(text) ||
        String(item.category || '').toLowerCase().includes(text) ||
        String(item.sub_category || '').toLowerCase().includes(text) ||
        String(item.make || '').toLowerCase().includes(text)
      );
    });
  }, [baseFilteredProducts, searchText]);

  const filteredEnquiries = useMemo(() => {
    const text = enquirySearch.trim().toLowerCase();

    return enquiries.filter((item) => {
      const status = item.status || 'New';

      const matchesStatus =
        enquiryStatusFilter === 'all' || status === enquiryStatusFilter;

      const matchesSearch =
        !text ||
        String(item.name || '').toLowerCase().includes(text) ||
        String(item.companyName || '').toLowerCase().includes(text) ||
        String(item.contactNumber || '').toLowerCase().includes(text) ||
        String(item.emailId || '').toLowerCase().includes(text) ||
        String(item.productRequired || '').toLowerCase().includes(text) ||
        String(item.partNumber || '').toLowerCase().includes(text);

      return matchesStatus && matchesSearch;
    });
  }, [enquiries, enquirySearch, enquiryStatusFilter]);

  const filterButtons = [
    { key: 'all', label: 'All Products', count: products.length },
    {
      key: 'missing_image',
      label: 'Missing Image',
      count: products.filter((item) => isBlank(item.image_url)).length,
    },
    {
      key: 'missing_part_number',
      label: 'Missing Part No',
      count: products.filter((item) => isBlank(item.part_number)).length,
    },
    {
      key: 'missing_category',
      label: 'Missing Category',
      count: products.filter((item) => isBlank(item.category)).length,
    },
    {
      key: 'missing_sub_category',
      label: 'Missing Sub Category',
      count: products.filter((item) => isBlank(item.sub_category)).length,
    },
    {
      key: 'missing_make',
      label: 'Missing Make',
      count: products.filter((item) => isBlank(item.make)).length,
    },
    {
      key: 'missing_description',
      label: 'Missing Description',
      count: products.filter((item) => isBlank(item.description)).length,
    },
    {
      key: 'inactive',
      label: 'Inactive',
      count: products.filter((item) => item.status === 'Inactive').length,
    },
  ];

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin-login';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setMsg('');
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);

    setForm({
      product_name: product.product_name || '',
      part_number: product.part_number || '',
      category: product.category || '',
      sub_category: product.sub_category || '',
      make: product.make || '',
      description: product.description || '',
      image_url: product.image_url || '',
      status: product.status || 'Active',
    });

    setMsg('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setMsg('');
    setForm(emptyForm);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${API_URL}/upload-r2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Image upload failed');
      }

      setForm((prev) => ({
        ...prev,
        image_url: result.imageUrl,
      }));
    } catch (error) {
      setMsg(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelUploading(true);
    setMsg('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rows.length) {
        alert('Excel file is empty');
        setExcelUploading(false);
        e.target.value = '';
        return;
      }

      const payload = rows.map((row) => ({
        product_name: String(row.product_name || '').trim(),
        part_number: String(row.part_number || '').trim(),
        category: String(row.category || '').trim(),
        sub_category: String(row.sub_category || '').trim(),
        make: String(row.make || '').trim(),
        description: String(row.description || '').trim(),
        image_url: String(row.image_url || '').trim(),
        status: String(row.status || 'Active').trim() || 'Active',
      }));

      const invalidRows = payload
        .map((item, index) => ({ ...item, excelRow: index + 2 }))
        .filter(
          (item) =>
            !item.product_name ||
            !item.category ||
            !allowedCategories.includes(item.category)
        );

      if (invalidRows.length > 0) {
        const errorText = invalidRows
          .slice(0, 10)
          .map(
            (item) =>
              `Row ${item.excelRow}: product_name="${item.product_name}", category="${item.category}"`
          )
          .join('\n');

        alert(
          `Excel upload stopped.\n\nProduct Name and Category required.\nCategory must be exact.\n\nInvalid rows:\n${errorText}\n\nAllowed categories:\n${allowedCategories.join(
            '\n'
          )}`
        );

        setExcelUploading(false);
        e.target.value = '';
        return;
      }

      const { error } = await supabase.from('products').insert(payload);

      if (error) {
        alert(error.message);
        setExcelUploading(false);
        e.target.value = '';
        return;
      }

      alert(`${payload.length} products uploaded successfully`);
      setExcelUploading(false);
      e.target.value = '';
      fetchProducts();
    } catch (error) {
      alert(error.message);
      setExcelUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const payload = {
      product_name: form.product_name.trim(),
      part_number: form.part_number.trim(),
      category: form.category.trim(),
      sub_category: form.sub_category.trim(),
      make: form.make.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      status: form.status,
    };

    let error;

    if (editingProduct) {
      const result = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);

      error = result.error;
    } else {
      const result = await supabase.from('products').insert([payload]);
      error = result.error;
    }

    if (error) {
      setMsg(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    closeForm();
    fetchProducts();
  };

  const handleDelete = async (product) => {
    const confirmDelete = window.confirm(
      `Delete product "${product.product_name}"?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchProducts();
  };

  const updateEnquiryField = (id, field, value) => {
    setEnquiries((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, [field]: value } : item
      )
    );
  };

  const saveEnquiryUpdate = async (item) => {
    try {
      setUpdatingEnquiryId(item.id);

      await fetch(ENQUIRY_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'updateEnquiry',
          id: item.id,
          status: item.status || 'New',
          assignedTo: item.assignedTo || '',
          remarks: item.remarks || '',
        }),
      });

      setTimeout(() => {
        fetchEnquiries();
      }, 800);
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdatingEnquiryId(null);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Checking Access...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>

        <p>Your email is not authorized for MR Apex Admin Panel.</p>

        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/admin-login';
          }}
        >
          Logout
        </Button>
      </div>
    );
  }

  const BlankBadge = ({ text = 'Pending' }) => (
    <span className="inline-block px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
      {text}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-5">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">MR Apex Admin Dashboard</h1>

            <div className="flex gap-2 mt-4">
              <Button
                variant={activeTab === 'products' ? 'default' : 'outline'}
                onClick={() => setActiveTab('products')}
              >
                Products
              </Button>

              <Button
                variant={activeTab === 'enquiries' ? 'default' : 'outline'}
                onClick={() => setActiveTab('enquiries')}
              >
                Enquiries ({enquiries.length})
              </Button>
            </div>

            <p className="text-gray-500 mt-2">
              Manage products, images, enquiries and business follow-ups
            </p>
          </div>

          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {activeTab === 'products' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="border rounded-xl p-4 bg-slate-50 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <Button onClick={openAddForm}>Add Product</Button>

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  id="excelUpload"
                  className="hidden"
                  onChange={handleExcelUpload}
                />

                <Button
                  variant="outline"
                  disabled={excelUploading}
                  onClick={() =>
                    document.getElementById('excelUpload').click()
                  }
                >
                  {excelUploading ? 'Uploading Excel...' : 'Upload Excel'}
                </Button>
              </div>

              <div className="w-full lg:w-[380px]">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search name, part no, category, make..."
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Pending Details Filter
              </p>

              <div className="flex flex-wrap gap-2">
                {filterButtons.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      activeFilter === filter.key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {showForm && activeTab === 'products' && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>

                <button
                  type="button"
                  onClick={closeForm}
                  className="text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name
                  </label>
                  <input
                    name="product_name"
                    value={form.product_name}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Part Number
                  </label>
                  <input
                    name="part_number"
                    value={form.part_number}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Category</option>
                    {allowedCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sub Category
                  </label>
                  <input
                    name="sub_category"
                    value={form.sub_category}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Make
                  </label>
                  <input
                    name="make"
                    value={form.make}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Product Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full border rounded-lg px-3 py-2"
                  />

                  {uploading && (
                    <p className="text-sm text-blue-600 mt-2">
                      Uploading image...
                    </p>
                  )}

                  {form.image_url && (
                    <div className="mt-3">
                      <img
                        src={form.image_url}
                        alt="Preview"
                        className="w-32 h-32 object-contain border rounded-lg bg-white"
                      />

                      <input
                        name="image_url"
                        value={form.image_url}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 mt-3"
                        placeholder="Image URL"
                      />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                  />
                </div>

                {msg && (
                  <div className="md:col-span-2 text-red-600 text-sm">
                    {msg}
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>

                  <Button type="submit" disabled={saving || uploading}>
                    {saving
                      ? 'Saving...'
                      : editingProduct
                        ? 'Update Product'
                        : 'Save Product'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'products' ? (
          loading ? (
            <p>Loading products...</p>
          ) : (
            <>
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
                <p>
                  Showing {filteredProducts.length} of {products.length}{' '}
                  products
                </p>

                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="text-slate-900 underline text-left"
                  >
                    Clear search
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-3 text-left">Image</th>
                      <th className="p-3 text-left">Product Name</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Sub Category</th>
                      <th className="p-3 text-left">Part No</th>
                      <th className="p-3 text-left">Make</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }
                      >
                        <td className="p-3 border-t">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name || 'Product'}
                              className="w-16 h-16 object-contain border rounded-lg bg-white"
                            />
                          ) : (
                            <BlankBadge text="No Image" />
                          )}
                        </td>

                        <td className="p-3 border-t font-medium">
                          {isBlank(item.product_name) ? (
                            <BlankBadge text="Missing" />
                          ) : (
                            item.product_name
                          )}
                        </td>

                        <td className="p-3 border-t">
                          {isBlank(item.category) ? (
                            <BlankBadge text="Missing" />
                          ) : (
                            item.category
                          )}
                        </td>

                        <td className="p-3 border-t">
                          {isBlank(item.sub_category) ? (
                            <BlankBadge text="Missing" />
                          ) : (
                            item.sub_category
                          )}
                        </td>

                        <td className="p-3 border-t">
                          {isBlank(item.part_number) ? (
                            <BlankBadge text="Missing" />
                          ) : (
                            item.part_number
                          )}
                        </td>

                        <td className="p-3 border-t">
                          {isBlank(item.make) ? (
                            <BlankBadge text="Missing" />
                          ) : (
                            item.make
                          )}
                        </td>

                        <td className="p-3 border-t max-w-[260px]">
                          {isBlank(item.description) ? (
                            <BlankBadge text="Missing" />
                          ) : (
                            <span className="block line-clamp-2">
                              {item.description}
                            </span>
                          )}
                        </td>

                        <td className="p-3 border-t">
                          {item.status === 'Inactive' ? (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded">
                              Inactive
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="p-3 border-t">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditForm(item)}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center p-6">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              {enquiryCards.map((card) => (
                <div
                  key={card.label}
                  className="border rounded-xl p-4 bg-slate-50 shadow-sm"
                >
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border rounded-xl p-5 bg-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Enquiries CRM</h2>
                  <p className="text-sm text-gray-500">
                    Track enquiry status, quotation stage and follow-ups
                  </p>
                </div>

                <Button variant="outline" onClick={fetchEnquiries}>
                  Refresh
                </Button>
              </div>

              <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="w-full lg:w-[420px]">
                  <input
                    type="text"
                    value={enquirySearch}
                    onChange={(e) => setEnquirySearch(e.target.value)}
                    placeholder="Search name, company, contact, product, part no..."
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEnquiryStatusFilter('all')}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      enquiryStatusFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    All ({enquiries.length})
                  </button>

                  {enquiryStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEnquiryStatusFilter(status)}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        enquiryStatusFilter === status
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {status} (
                      {
                        enquiries.filter(
                          (item) => (item.status || 'New') === status
                        ).length
                      }
                      )
                    </button>
                  ))}
                </div>
              </div>

              {loadingEnquiries ? (
                <p>Loading enquiries...</p>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Customer</th>
                        <th className="p-3 text-left">Contact</th>
                        <th className="p-3 text-left">Product</th>
                        <th className="p-3 text-left">Image</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Assigned To</th>
                        <th className="p-3 text-left">Remarks</th>
                        <th className="p-3 text-left">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredEnquiries.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className={
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }
                        >
                          <td className="p-3 border-t min-w-[150px]">
                            {item.dateTime
                              ? new Date(item.dateTime).toLocaleString()
                              : ''}
                          </td>

                          <td className="p-3 border-t min-w-[220px]">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.companyName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.address}
                            </p>
                          </td>

                          <td className="p-3 border-t min-w-[180px]">
                            <p>{item.contactNumber}</p>
                            <p className="text-xs text-gray-500">
                              {item.emailId}
                            </p>
                          </td>

                          <td className="p-3 border-t min-w-[220px]">
                            <p className="font-medium">
                              {item.productRequired}
                            </p>
                            <p className="text-xs text-gray-500">
                              Part No: {item.partNumber || '-'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity || '-'}
                            </p>
                            {item.message && (
                              <p className="text-xs text-gray-500 mt-1">
                                Msg: {item.message}
                              </p>
                            )}
                          </td>

                          <td className="p-3 border-t">
                            {item.referenceImage ? (
                              <a
                                href={item.referenceImage}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline"
                              >
                                View
                              </a>
                            ) : (
                              <BlankBadge text="No Image" />
                            )}
                          </td>

                          <td className="p-3 border-t min-w-[160px]">
                            <select
                              value={item.status || 'New'}
                              onChange={(e) =>
                                updateEnquiryField(
                                  item.id,
                                  'status',
                                  e.target.value
                                )
                              }
                              className="w-full border rounded-lg px-2 py-2"
                            >
                              {enquiryStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 border-t min-w-[150px]">
                            <input
                              value={item.assignedTo || ''}
                              onChange={(e) =>
                                updateEnquiryField(
                                  item.id,
                                  'assignedTo',
                                  e.target.value
                                )
                              }
                              placeholder="Ravi / Partner"
                              className="w-full border rounded-lg px-2 py-2"
                            />
                          </td>

                          <td className="p-3 border-t min-w-[220px]">
                            <textarea
                              value={item.remarks || ''}
                              onChange={(e) =>
                                updateEnquiryField(
                                  item.id,
                                  'remarks',
                                  e.target.value
                                )
                              }
                              placeholder="Follow-up remarks"
                              className="w-full border rounded-lg px-2 py-2 min-h-[70px]"
                            />
                          </td>

                          <td className="p-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => saveEnquiryUpdate(item)}
                              disabled={updatingEnquiryId === item.id}
                            >
                              {updatingEnquiryId === item.id
                                ? 'Saving...'
                                : 'Save'}
                            </Button>
                          </td>
                        </tr>
                      ))}

                      {filteredEnquiries.length === 0 && (
                        <tr>
                          <td colSpan="9" className="text-center p-6">
                            No enquiries found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;