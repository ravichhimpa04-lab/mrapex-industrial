import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Truck,
  Settings,
  Cog,
  Droplets,
  Gauge,
  Wrench,
  Package,
  MessageCircle,
  ArrowLeft,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { supabase } from '@/lib/supabaseClient';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const whatsappNumber = '919602338804';

const fixedCategories = [
  'Volvo Parts',
  'Pumps',
  'Valves',
  'Fittings',
  'Hose Pipes',
  'Couplings',
  'MSV Spares',
  'Other Machinery Items',
];

const categoryMeta = {
  'Volvo Parts': {
    icon: Truck,
    description:
      'Volvo machinery parts, engine parts, hydraulic parts and replacement spares.',
  },
  Fittings: {
    icon: Settings,
    description:
      'Hydraulic fittings, hose fittings, pneumatic fittings and tube fittings.',
  },
  'Hose Pipes': {
    icon: Settings,
    description:
      'Hydraulic hoses, hose pipes, hose assemblies and industrial hose solutions.',
  },
  Couplings: {
    icon: Cog,
    description:
      'Quick release couplings, hydraulic couplings and industrial couplings.',
  },
  Pumps: {
    icon: Droplets,
    description:
      'Hydraulic pumps, gear pumps, piston pumps and industrial pump solutions.',
  },
  Valves: {
    icon: Gauge,
    description:
      'Solenoid valves, pressure valves, flow control valves and directional valves.',
  },
  'MSV Spares': {
    icon: Wrench,
    description:
      'MSV spare parts, seal kits, repair kits and machinery replacement items.',
  },
  'Other Machinery Items': {
    icon: Package,
    description:
      'Bearings, fasteners, filters, sensors and other MRO machinery supplies.',
  },
};

function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    company: '',
    company_address: '',
    quantity: '',
    message: '',
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'Active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase products error:', error);
          setProducts([]);
          return;
        }

        const formattedProducts = (data || []).map((item) => ({
  id: item.id,

  name: item.product_name || '',

  category: item.category || '',

  subCategory: item.sub_category || '',

  partNo: item.part_number || '',

  make: item.make || '',

  description: item.description || '',

  image: item.image_url || '',

  status: item.status || '',
}));

        setProducts(formattedProducts);
      } catch (err) {
        console.error('Products load error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const grouped = {};

    products.forEach((product) => {
      if (!product.category) return;

      const cleanCategory = product.category.trim();

      if (!grouped[cleanCategory]) {
        grouped[cleanCategory] = [];
      }

      grouped[cleanCategory].push(product);
    });

    return fixedCategories.map((name) => ({
      name,
      icon: categoryMeta[name]?.icon || Package,
      description:
        categoryMeta[name]?.description ||
        'Industrial components, machinery parts and MRO supplies.',
      items: grouped[name] || [],
    }));
  }, [products]);

  useEffect(() => {
    if (categories.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const categoryFromUrl = params.get('category');
    const subCategoryFromUrl = params.get('subCategory');

    if (
      categoryFromUrl &&
      categories.some((cat) => cat.name === categoryFromUrl)
    ) {
      setSelectedCategory(categoryFromUrl);

      if (subCategoryFromUrl) {
        setSelectedSubCategory(subCategoryFromUrl);
      }
    }
  }, [categories]);

  const currentCategory = categories.find(
    (cat) => cat.name === selectedCategory
  );

  const subCategories = currentCategory
    ? [
        ...new Set(
          currentCategory.items
            .map((item) => item.subCategory)
            .filter(Boolean)
        ),
      ]
    : [];

  const visibleProducts =
    currentCategory && selectedSubCategory
      ? currentCategory.items.filter(
          (item) => item.subCategory === selectedSubCategory
        )
      : currentCategory?.items || [];

  const changeCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory(null);

    window.history.pushState(
      {},
      '',
      `/products?category=${encodeURIComponent(categoryName)}`
    );
  };

  const changeSubCategory = (subCategoryName) => {
    setSelectedSubCategory(subCategoryName);

    if (subCategoryName) {
      window.history.pushState(
        {},
        '',
        `/products?category=${encodeURIComponent(
          selectedCategory
        )}&subCategory=${encodeURIComponent(subCategoryName)}`
      );
    } else {
      window.history.pushState(
        {},
        '',
        `/products?category=${encodeURIComponent(selectedCategory)}`
      );
    }
  };

  const getWhatsappMessage = (item, categoryName) => {
    const details = [];

    if (item.partNo) details.push(`Part Number: ${item.partNo}`);
    if (item.make) details.push(`Make: ${item.make}`);
    if (item.subCategory) details.push(`Sub Category: ${item.subCategory}`);

    return `Hello MR Apex Industrial Components, I need quotation for ${
      item.name
    }. Category: ${categoryName}.${
      details.length ? ` ${details.join('. ')}` : ''
    }`;
  };

  const openQuoteForm = (item, categoryName) => {
    setSelectedProduct({ ...item, category: categoryName });
    setForm({
      name: '',
      mobile: '',
      email: '',
      company: '',
      company_address: '',
      quantity: '',
      message: '',
    });
  };

  const submitEnquiry = async (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    setSending(true);

    const payload = {
  name: form.name,
  mobile: form.mobile,
  email: form.email,
  company: form.company,
  company_address: form.company_address,
  quantity: form.quantity,
  message: form.message,

  productName:
    selectedProduct.product_name ||
    selectedProduct.name ||
    '',

  partNo:
    selectedProduct.part_number ||
    selectedProduct.partNo ||
    '',

  category:
    selectedProduct.category ||
    '',

  subCategory:
    selectedProduct.sub_category ||
    selectedProduct.subCategory ||
    '',

  make:
    selectedProduct.make ||
    '',

  description:
    selectedProduct.description ||
    '',
};

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      alert('Enquiry submitted successfully.');
      setSelectedProduct(null);
    } catch (error) {
      console.error('Enquiry error:', error);
      alert('Enquiry submit nahi hui. Please dobara try karein.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Products - MR Apex Industrial Components</title>
        <meta
          name="description"
          content="Browse Volvo Parts, Fittings, Couplings, Pumps, Valves, MSV Spare and Other Machinery Items from MR Apex Industrial Components."
        />
      </Helmet>

      <Header />

      <main>
        <section className="py-5 bg-primary text-primary-foreground">
          <div className="container-custom text-center max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {currentCategory
                ? currentCategory.name
                : 'Our Product Categories'}
            </h1>

            {currentCategory && (
              <div className="w-10 h-0.5 bg-white/70 mx-auto mb-2 rounded-full"></div>
            )}

            <p className="text-sm md:text-base opacity-90 leading-relaxed mb-3 max-w-4xl mx-auto">
              {currentCategory
                ? currentCategory.description
                : 'Select a category to view available products, part numbers and enquiry options.'}
            </p>

            {currentCategory && categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-7xl mx-auto">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.name;

                  return (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => changeCategory(category.name)}
                      className={`px-3 py-1.5 rounded-lg border transition-all font-semibold text-xs flex items-center gap-2 min-w-[105px] justify-center
                        ${
                          isActive
                            ? 'bg-white text-primary border-white shadow-md'
                            : 'bg-white/5 text-white border-white/30 hover:bg-white hover:text-primary'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>
                        {category.name} ({category.items.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentCategory && subCategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-2 pt-2 border-t border-white/20 max-w-7xl mx-auto">
                <button
                  type="button"
                  onClick={() => changeSubCategory(null)}
                  className={`px-3 py-1.5 rounded-lg border transition-all font-semibold text-xs min-w-[105px]
                    ${
                      !selectedSubCategory
                        ? 'bg-white text-primary border-white shadow-md'
                        : 'bg-white/5 text-white border-white/30 hover:bg-white hover:text-primary'
                    }`}
                >
                  All {currentCategory.name}
                </button>

                {subCategories.map((subCategory) => (
                  <button
                    key={subCategory}
                    type="button"
                    onClick={() => changeSubCategory(subCategory)}
                    className={`px-3 py-1.5 rounded-lg border transition-all font-semibold text-xs min-w-[105px]
                      ${
                        selectedSubCategory === subCategory
                          ? 'bg-white text-primary border-white shadow-md'
                          : 'bg-white/5 text-white border-white/30 hover:bg-white hover:text-primary'
                      }`}
                  >
                    {subCategory}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container-custom">
            {loading ? (
              <div className="text-center text-muted-foreground">
                Loading products...
              </div>
            ) : !currentCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category, index) => {
                  const Icon = category.icon;

                  return (
                    <motion.button
                      key={category.name}
                      type="button"
                      onClick={() => changeCategory(category.name)}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="bg-card rounded-2xl p-8 shadow-sm border text-left hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>

                      <h2 className="text-2xl font-bold mb-4 text-foreground">
                        {category.name}
                      </h2>

                      <p className="text-muted-foreground leading-relaxed mb-3">
                        {category.description}
                      </p>

                      <p className="text-sm text-muted-foreground mb-6">
                        {category.items.length} products available
                      </p>

                      <span className="text-primary font-semibold">
                        View Products →
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                    window.history.pushState({}, '', '/products');
                  }}
                  className="mb-8"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Categories
                </Button>

                {visibleProducts.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-10 text-center text-muted-foreground">
                    Products will be added soon in this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {visibleProducts.map((item, index) => {
                      const message = getWhatsappMessage(
                        item,
                        currentCategory.name
                      );

                      return (
                        <motion.div
                          key={`${item.id || item.name}-${item.partNo || index}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.08 }}
                          className="bg-card rounded-2xl overflow-hidden shadow-sm border flex flex-col h-full"
                        >
                          <div className="h-56 bg-white border-b overflow-hidden">
                            <img
                              src={
                                item.image ||
                                item.imageUrl ||
                                item['Image URL'] ||
                                'https://via.placeholder.com/500x350?text=Product+Image'
                              }
                              alt={item.name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://via.placeholder.com/500x350?text=Product+Image';
                              }}
                            />
                          </div>

                          <div className="p-6 flex flex-col flex-grow">
                            <p className="text-sm font-semibold text-primary mb-2">
                              {currentCategory.name}
                              {item.subCategory && ` / ${item.subCategory}`}
                            </p>

                            <h2 className="text-xl font-bold text-foreground mb-3">
                              {item.name}
                            </h2>

                            <div className="text-sm text-muted-foreground mb-6 space-y-1">
                              {item.partNo && (
                                <p>
                                  <span className="font-semibold text-foreground">
                                    Part Number:
                                  </span>{' '}
                                  {item.partNo}
                                </p>
                              )}

                              {item.make && (
                                <p>
                                  <span className="font-semibold text-foreground">
                                    Make:
                                  </span>{' '}
                                  {item.make}
                                </p>
                              )}

                              {item.description && (
                                <p className="pt-2">{item.description}</p>
                              )}
                            </div>

                            <div className="mt-auto space-y-3">
                              <Button
                                asChild
                                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white"
                              >
                                <a
                                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                    message
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Enquire on WhatsApp
                                </a>
                              </Button>

                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  openQuoteForm(item, currentCategory.name)
                                }
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Request Quote
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-2">Request Quote</h2>

            <p className="text-sm text-gray-600 mb-5">
              {selectedProduct.name}
              {selectedProduct.partNo && ` | ${selectedProduct.partNo}`}
              {selectedProduct.subCategory &&
                ` | ${selectedProduct.subCategory}`}
            </p>

            <form onSubmit={submitEnquiry} className="space-y-4">
              <input
                required
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                required
                placeholder="Mobile / WhatsApp Number"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                placeholder="Email Optional"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                placeholder="Company Name"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                placeholder="Company Address"
                value={form.company_address}
                onChange={(e) =>
                  setForm({ ...form, company_address: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3"
              />

              <textarea
                placeholder="Message / Requirement"
                value={form.message}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3 min-h-[100px]"
              />

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? 'Submitting...' : 'Submit Enquiry'}
              </Button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default ProductsPage;