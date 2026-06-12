
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

const API_URL =
  'https://script.google.com/macros/s/AKfycbyQ3jhuxhwtVeiwfSAZvssvOrwH-Y7sCBbIxEx2mNxnUA7GO6lmZGtibp3dh1B5cg9T/exec';

const whatsappNumber = '919602338804';

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
  'MSV Spare': {
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
  console.log('MR APEX API CALL STARTED');
  fetch(API_URL + '?t=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const grouped = {};

    products.forEach((product) => {
      if (!product.category) return;

      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }

      grouped[product.category].push(product);
    });

    return Object.keys(grouped).map((name) => ({
      name,
      icon: categoryMeta[name]?.icon || Package,
      description:
        categoryMeta[name]?.description ||
        'Industrial components, machinery parts and MRO supplies.',
      items: grouped[name],
    }));
  }, [products]);

  const currentCategory = categories.find(
    (cat) => cat.name === selectedCategory
  );

  const getWhatsappMessage = (item, categoryName) => {
    const details = [];

    if (item.partNo) details.push(`Part Number: ${item.partNo}`);
    if (item.make) details.push(`Make: ${item.make}`);

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
      productName: selectedProduct.name,
      partNo: selectedProduct.partNo || '',
      category: selectedProduct.category,
      make: selectedProduct.make || '',
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      alert('Enquiry submitted successfully.');
      setSelectedProduct(null);
    } catch (error) {
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
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container-custom text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {currentCategory
                ? currentCategory.name
                : 'Our Product Categories'}
            </h1>

            <p className="text-lg md:text-xl opacity-90 leading-relaxed">
              {currentCategory
                ? currentCategory.description
                : 'Select a category to view available products, part numbers and enquiry options.'}
            </p>
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container-custom">
            {loading ? (
              <div className="text-center text-muted-foreground">
                Loading products...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No products found. Please add products in Google Sheet with
                Status Active.
              </div>
            ) : !currentCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category, index) => {
                  const Icon = category.icon;

                  return (
                    <motion.button
                      key={category.name}
                      type="button"
                      onClick={() => setSelectedCategory(category.name)}
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
                  onClick={() => setSelectedCategory(null)}
                  className="mb-8"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Categories
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {currentCategory.items.map((item, index) => {
                    const message = getWhatsappMessage(
                      item,
                      currentCategory.name
                    );

                    return (
                      <motion.div
                        key={`${item.name}-${item.partNo}-${index}`}
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
                              'https://via.placeholder.com/500x350?text=Product+Image'
                            }
                            alt={item.name}
                            className="w-full h-full object-contain p-4"
                          />
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                          <p className="text-sm font-semibold text-primary mb-2">
                            {currentCategory.name}
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
            </p>

            <form onSubmit={submitEnquiry} className="space-y-4">
              <input
                required
                placeholder="Your Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                required
                placeholder="Mobile / WhatsApp Number"
                value={form.mobile}
                onChange={(e) =>
                  setForm({ ...form, mobile: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                placeholder="Email Optional"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3"
              />
              <input
                placeholder="Company Name"
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-3"
              />
              <input
                placeholder="Company Address"
                value={form.companyAddress}
                onChange={(e) =>
                  setForm({ ...form, companyAddress: e.target.value })
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