import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Share2, X } from 'lucide-react';
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
              item.id !== found.id && item.category === found.category
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

  const whatsappMessage = product
    ? `Hello MR Apex Industrial Components, I need quotation for ${
        product.product_name || ''
      }${product.part_number ? `. Part Number: ${product.part_number}` : ''}${
        product.make ? `. Make: ${product.make}` : ''
      }`
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
          <p className="text-muted-foreground">Loading product...</p>
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
        <main className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This product is not available or may have been removed.
            </p>
            <Button asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
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
    } | MR Apex Industrial Components`;

  const description =
    product.meta_description ||
    `Buy ${product.product_name}${
      product.part_number ? ` part no ${product.part_number}` : ''
    } from MR Apex Industrial Components. Industrial machinery spare parts supplier in India.`;

  const canonicalUrl = `https://mrapexindustrial.in/products/${
    product.slug ||
    makeSlug(`${product.product_name || ''} ${product.part_number || ''}`)
  }`;

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
  };

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
        <section className="bg-primary text-primary-foreground py-8">
          <div className="container-custom">
            <Button
              asChild
              variant="outline"
              className="mb-5 bg-white text-primary hover:bg-white/90"
            >
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>

            <p className="text-sm opacity-90 mb-2">
              {product.category || 'Products'}
              {product.sub_category ? ` / ${product.sub_category}` : ''}
            </p>

            <h1 className="text-3xl md:text-5xl font-bold">
              {product.product_name}
            </h1>
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <div className="aspect-[4/3] bg-white flex items-center justify-center">
                  <img
                    src={
                      product.image_url ||
                      'https://via.placeholder.com/700x500?text=Product+Image'
                    }
                    alt={product.product_name}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-105 cursor-zoom-in"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-5">Product Details</h2>

                <div className="space-y-3 text-sm md:text-base">
                  {product.part_number && (
                    <p>
                      <span className="font-semibold">Part Number:</span>{' '}
                      {product.part_number}
                    </p>
                  )}

                  {product.make && (
                    <p>
                      <span className="font-semibold">Make:</span>{' '}
                      {product.make}
                    </p>
                  )}

                  {product.category && (
                    <p>
                      <span className="font-semibold">Category:</span>{' '}
                      {product.category}
                    </p>
                  )}

                  {product.sub_category && (
                    <p>
                      <span className="font-semibold">Sub Category:</span>{' '}
                      {product.sub_category}
                    </p>
                  )}

                  {product.description && (
                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-2">Description</p>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    asChild
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white"
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

                  <Button variant="outline" onClick={openQuoteForm}>
                    <Send className="w-4 h-4 mr-2" />
                    Request Quote
                  </Button>

                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Product
                  </Button>
                </div>
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-5">Related Products</h2>

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
                        className="bg-white border rounded-2xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="h-40 bg-white flex items-center justify-center mb-4">
                          <img
                            src={
                              item.image_url ||
                              'https://via.placeholder.com/400x300?text=Product'
                            }
                            alt={item.product_name}
                            loading="lazy"
                            decoding="async"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <h3 className="font-bold text-foreground line-clamp-2">
                          {item.product_name}
                        </h3>

                        {item.part_number && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Part No: {item.part_number}
                          </p>
                        )}
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
                value={form.company_address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_address: e.target.value,
                  })
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

export default ProductDetailPage;