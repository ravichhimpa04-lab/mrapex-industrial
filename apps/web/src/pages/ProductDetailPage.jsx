import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { supabase } from '@/lib/supabaseClient';

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
        const fallbackSlug = makeSlug(`${item.product_name || ''} ${item.part_number || ''}`);
        return savedSlug === productSlug || fallbackSlug === productSlug;
      });

      setProduct(found || null);

      if (found) {
        const related = items
          .filter(
            (item) =>
              item.id !== found.id &&
              item.category === found.category
          )
          .slice(0, 6);

        setRelatedProducts(related);
      }

      setLoading(false);
    };

    loadProduct();
  }, [productSlug]);

  const whatsappMessage = product
    ? `Hello MR Apex Industrial Components, I need quotation for ${product.product_name || ''}${
        product.part_number ? `. Part Number: ${product.part_number}` : ''
      }${product.make ? `. Make: ${product.make}` : ''}`
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
  `${product.product_name}${product.part_number ? ` | Part No ${product.part_number}` : ''} | MR Apex Industrial Components`;

const description =
  product.meta_description ||
  `Buy ${product.product_name}${product.part_number ? ` part no ${product.part_number}` : ''} from MR Apex Industrial Components. Industrial machinery spare parts supplier in India.`;

const canonicalUrl = `https://mrapexindustrial.in/products/${
  product.slug || makeSlug(`${product.product_name || ''} ${product.part_number || ''}`)
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
            <Button asChild variant="outline" className="mb-5 bg-white text-primary hover:bg-white/90">
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
                    src={product.image_url || 'https://via.placeholder.com/700x500?text=Product+Image'}
                    alt={product.product_name}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-110 cursor-zoom-in"
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
                  <Button asChild className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enquire on WhatsApp
                    </a>
                  </Button>

                  <Button asChild variant="outline">
                    <Link to={`/products?category=${encodeURIComponent(product.category || '')}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Request Quote
                    </Link>
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
                      item.slug || makeSlug(`${item.product_name || ''} ${item.part_number || ''}`);

                    return (
                      <Link
                        key={item.id}
                        to={`/products/${itemSlug}`}
                        className="bg-white border rounded-2xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="h-40 bg-white flex items-center justify-center mb-4">
                          <img
                            src={item.image_url || 'https://via.placeholder.com/400x300?text=Product'}
                            alt={item.product_name}
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

      <Footer />
    </>
  );
}

export default ProductDetailPage;