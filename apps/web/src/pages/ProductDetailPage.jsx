import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Copy,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Send,
  Share2,
  ShieldCheck,
  Truck,
  Wrench,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { supabase } from '@/lib/supabaseClient';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const whatsappNumber = '919602338804';

const makeSlug = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function ProductDetailPage() {
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
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

  const productSlug = useMemo(() => slug || '', [slug]);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'Active');

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const items = data || [];

      const found = items.find((item) => {
        const savedSlug = item.slug || '';
        const fallbackSlug = makeSlug(
          `${item.product_name || ''} ${item.part_number || ''}`
        );

        return savedSlug === productSlug || fallbackSlug === productSlug;
      });

      setProduct(found || null);

      if (found) {
        const related = items
          .filter(
            (item) =>
              item.id !== found.id &&
              (item.category === found.category ||
                item.sub_category === found.sub_category ||
                item.make === found.make)
          )
          .slice(0, 6);

        setRelatedProducts(related);
      } else {
        setRelatedProducts([]);
      }

      setLoading(false);
    };

    loadProduct();
  }, [productSlug]);

  const productUrl = product
    ? `https://mrapexindustrial.in/products/${
        product.slug ||
        makeSlug(`${product.product_name || ''} ${product.part_number || ''}`)
      }`
    : '';

  const whatsappMessage = product
    ? `Hello MR Apex Industrial Components, I need quotation for ${
        product.product_name || ''
      }${product.part_number ? `. Part Number: ${product.part_number}` : ''}${
        product.make ? `. Make: ${product.make}` : ''
      }${product.category ? `. Category: ${product.category}` : ''}`
    : '';

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.product_name,
          text: product.product_name,
          url: shareUrl,
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Product link copied successfully.');
    }
  };

  const openQuoteForm = () => {
    setSelectedProduct(product);
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
      productName: selectedProduct.product_name || '',
      partNo: selectedProduct.part_number || '',
      category: selectedProduct.category || '',
      subCategory: selectedProduct.sub_category || '',
      make: selectedProduct.make || '',
      description: selectedProduct.description || '',
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

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Helmet>
          <title>Product Not Found - MR Apex Industrial Components</title>
        </Helmet>

        <Header />

        <main className="min-h-[60vh] flex items-center justify-center p-6 bg-muted/40">
          <div className="text-center bg-white border rounded-3xl p-10 max-w-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Package className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-3xl font-extrabold mb-3">
              Product Not Found
            </h1>

            <p className="text-muted-foreground mb-6">
              This product is not available or may have been removed. You can
              browse our catalogue or submit your industrial requirement.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-xl">
                <Link to="/products">Back to Products</Link>
              </Button>

              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/contact">Submit Requirement</Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const title =
    product.meta_title ||
    `${product.product_name}${
      product.part_number ? ` | Part No ${product.part_number}` : ''
    } | Industrial Parts Sourcing | MR Apex Industrial Components`;

  const description =
    product.meta_description ||
    `Source ${product.product_name}${
      product.part_number ? ` part no ${product.part_number}` : ''
    } from MR Apex Industrial Components. Submit RFQ for OEM, aftermarket and industrial machinery spare parts across India.`;

  const canonicalUrl = productUrl;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_name || '',
    image: product.image_url ? [product.image_url] : [],
    description,
    brand: {
      '@type': 'Brand',
      name: product.make || 'MR Apex Industrial Components',
    },
    sku: product.part_number || product.id || '',
    category: product.category || '',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'INR',
      url: canonicalUrl,
      seller: {
        '@type': 'Organization',
        name: 'MR Apex Industrial Components',
      },
    },
  };

  const detailRows = [
    { label: 'Part Number', value: product.part_number },
    { label: 'Make / Brand', value: product.make },
    { label: 'Category', value: product.category },
    { label: 'Sub Category', value: product.sub_category },
    { label: 'Availability', value: 'RFQ Based Confirmation' },
    { label: 'Supply Support', value: 'Pan India' },
  ].filter((row) => row.value);

  const rfqSteps = [
    'Share product details, part number or image',
    'MR Apex reviews sourcing availability',
    'Receive quotation and confirmation support',
    'Procurement and supply coordination',
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        {product.image_url && (
          <meta property="og:image" content={product.image_url} />
        )}
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      </Helmet>

      <Header />

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 container-custom py-10 md:py-14">
            <Button
              asChild
              variant="outline"
              className="mb-6 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
              <div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {product.category && (
                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300">
                      {product.category}
                    </span>
                  )}

                  {product.sub_category && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75">
                      {product.sub_category}
                    </span>
                  )}

                  {product.make && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/75">
                      Make: {product.make}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5">
                  {product.product_name}
                </h1>

                <p className="text-white/70 text-lg leading-relaxed max-w-3xl mb-7">
                  Submit RFQ for this industrial component. MR Apex supports OEM
                  sourcing, aftermarket replacement options and Pan India
                  industrial procurement assistance based on availability.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white"
                  >
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                        whatsappMessage
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enquire on WhatsApp
                    </a>
                  </Button>

                  <Button
                    onClick={openQuoteForm}
                    className="h-12 rounded-xl"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Request Quote
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h2 className="text-xl font-extrabold mb-5">
                  RFQ & Sourcing Support
                </h2>

                <div className="space-y-4">
                  {rfqSteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-extrabold shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-white/75 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                  <p className="text-sm text-white/70 leading-relaxed">
                    If exact OEM part is unavailable, our team can help check
                    compatible aftermarket or equivalent sourcing options.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
              <div className="bg-white rounded-3xl border shadow-sm p-5 md:p-6">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-white to-slate-50 border flex items-center justify-center overflow-hidden">
                  <img
                    src={
                      product.image_url ||
                      'https://via.placeholder.com/700x500?text=Product+Image'
                    }
                    alt={product.product_name}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    width="700"
                    height="500"
                    className="max-w-full max-h-full object-contain p-4 transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://via.placeholder.com/700x500?text=Product+Image';
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <ImageIcon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      Product Image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      For identification
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <FileText className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      RFQ Ready
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quote request enabled
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <Truck className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs font-bold text-foreground">
                      Pan India
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supply support
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl border shadow-sm p-6">
                  <h2 className="text-2xl font-extrabold mb-5">
                    Product Details
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailRows.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-2xl border bg-muted/40 p-4"
                      >
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                          {row.label}
                        </p>
                        <p className="text-sm font-extrabold text-foreground">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {product.description && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-extrabold text-foreground mb-2">
                        Description
                      </h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800">
                  <h2 className="text-2xl font-extrabold mb-4">
                    Need This Product or Similar Alternative?
                  </h2>

                  <p className="text-white/65 leading-relaxed mb-5">
                    Share your quantity, delivery location or technical
                    requirement. MR Apex will review availability and help with
                    OEM or compatible aftermarket sourcing support.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {[
                      'OEM Sourcing',
                      'Aftermarket Options',
                      'Part Number Matching',
                      'Bulk RFQ Support',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm font-semibold text-white/80"
                      >
                        <BadgeCheck className="w-4 h-4 text-blue-300 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={openQuoteForm} className="rounded-xl">
                      <Send className="w-4 h-4 mr-2" />
                      Request Quote
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                          whatsappMessage
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border bg-white p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Sourcing Support',
                    desc: 'RFQ based product availability and supplier coordination.',
                  },
                  {
                    icon: Boxes,
                    title: 'OEM / Aftermarket',
                    desc: 'Support for genuine and compatible replacement options.',
                  },
                  {
                    icon: MapPin,
                    title: 'Pan India Supply',
                    desc: 'Industrial procurement support across India.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Buyer Assistance',
                    desc: 'Help with identification, quotation and enquiry process.',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-2xl bg-muted/40 border p-5">
                      <Icon className="w-6 h-6 text-primary mb-3" />
                      <h3 className="font-extrabold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-primary font-semibold mb-1">
                      Related Products
                    </p>
                    <h2 className="text-3xl font-extrabold text-foreground">
                      Similar Industrial Components
                    </h2>
                  </div>

                  <Button asChild variant="outline" className="rounded-xl hidden sm:inline-flex">
                    <Link to="/products">
                      View All Products
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedProducts.map((item) => {
                    const itemSlug =
                      item.slug ||
                      makeSlug(
                        `${item.product_name || ''} ${
                          item.part_number || ''
                        }`
                      );

                    return (
                      <Link
                        key={item.id}
                        to={`/products/${itemSlug}`}
                        className="bg-white border rounded-3xl p-4 hover:shadow-xl hover:-translate-y-1 transition-all"
                      >
                        <div className="h-40 rounded-2xl bg-gradient-to-br from-white to-slate-50 border flex items-center justify-center mb-4">
                          <img
                            src={
                              item.image_url ||
                              'https://via.placeholder.com/400x300?text=Product'
                            }
                            alt={item.product_name}
                            loading="lazy"
                            decoding="async"
                            className="max-w-full max-h-full object-contain p-3"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://via.placeholder.com/400x300?text=Product';
                            }}
                          />
                        </div>

                        <h3 className="font-extrabold text-foreground line-clamp-2">
                          {item.product_name}
                        </h3>

                        {item.part_number && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Part No: {item.part_number}
                          </p>
                        )}

                        <p className="text-primary text-sm font-bold mt-3">
                          View Details →
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-extrabold mb-2">Request Quote</h2>

            <p className="text-sm text-gray-600 mb-5">
              {selectedProduct.product_name}
              {selectedProduct.part_number &&
                ` | ${selectedProduct.part_number}`}
              {selectedProduct.sub_category &&
                ` | ${selectedProduct.sub_category}`}
            </p>

            <form onSubmit={submitEnquiry} className="space-y-4">
              <input
                required
                placeholder="Your Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                required
                placeholder="Mobile / WhatsApp Number"
                value={form.mobile}
                onChange={(e) =>
                  setForm({ ...form, mobile: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Email Optional"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Company Name"
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Company Address"
                value={form.company_address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_address: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

              <textarea
                placeholder="Message / Requirement"
                value={form.message}
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-3 min-h-[100px]"
              />

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={sending}
              >
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

export default ProductDetailPage;