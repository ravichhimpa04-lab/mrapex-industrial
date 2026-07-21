import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CircleDot,
  Cog,
  Cylinder,
  Droplets,
  Filter,
  Gauge,
  Hammer,
  MessageCircle,
  Package,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { supabase } from '@/lib/supabaseClient';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const whatsappNumber = '919602338804';
const PRODUCTS_PER_PAGE = 24;

const makeSlug = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ALL_PRODUCTS_VALUE = '__all__';

// Small edit-distance function for typo-tolerant search matching — no
// external library needed, and fast enough for a few hundred products.
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

// Checks if a search word matches somewhere in the given text — either as a
// direct substring, or as a "close enough" (typo-tolerant) match to one of
// the words in the text.
function wordMatchesText(searchWord, text) {
  if (!searchWord) return true;
  if (text.includes(searchWord)) return true;

  const maxDistance = searchWord.length <= 4 ? 1 : 2;

  return text.split(/\s+/).some((textWord) => {
    if (Math.abs(textWord.length - searchWord.length) > maxDistance + 1) return false;
    return levenshteinDistance(textWord, searchWord) <= maxDistance;
  });
}

const fixedCategories = [
  'Volvo Parts',
  'Pumps',
  'Valves',
  'Fittings',
  'Hose Pipes',
  'Couplings',
  'MSV Spares',
  'Bearings',
  'Seals & Sealing Products',
  'Power Transmission Components',
  'Workshop Tools & Service Equipment',
  'Hydraulic Pumps & Motors',
  'Hydraulic Cylinders',
  'Filters & Filtration Systems',
  'Custom Engineering Parts',
  'Electrical Components',
  'Other Machinery Items',
];

// Smaller category names that should appear as part of "Other Machinery
// Items" (their own sub_category values are preserved, so they're still
// filterable within that section) rather than as their own top-level card.
const categoryAliases = {
  Fasteners: 'Other Machinery Items',
  'Pneumatic Components': 'Other Machinery Items',
};

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
  Bearings: {
    icon: CircleDot,
    description:
      'Ball bearings, roller bearings, thrust bearings, mounted bearings and bearing accessories.',
  },
  'Seals & Sealing Products': {
    icon: ShieldCheck,
    description:
      'O-rings, hydraulic seals, mechanical seals, gaskets and sealing washers.',
  },
  'Power Transmission Components': {
    icon: Boxes,
    description:
      'Belts, chains, pulleys, sprockets, shaft couplings and drive components.',
  },
  'Workshop Tools & Service Equipment': {
    icon: Hammer,
    description:
      'Hand tools, hose assembly tools, hydraulic service tools and precision measuring equipment.',
  },
  'Hydraulic Pumps & Motors': {
    icon: Droplets,
    description:
      'Hydraulic pumps, hydraulic motors, gear pump and piston pump components.',
  },
  'Hydraulic Cylinders': {
    icon: Cylinder,
    description:
      'Hydraulic cylinder assemblies, cylinder components, rod ends and mounting parts.',
  },
  'Filters & Filtration Systems': {
    icon: Filter,
    description:
      'Hydraulic filters, fuel filters, air filters and industrial filtration components.',
  },
  'Custom Engineering Parts': {
    icon: SlidersHorizontal,
    description:
      'Precision machined components, custom shafts, bushes and engineered wear parts.',
  },
  'Electrical Components': {
    icon: Zap,
    description:
      'Sensors, connectors, switches, wiring and other electrical machinery components.',
  },
  'Other Machinery Items': {
    icon: Package,
    description:
      'Fasteners, pneumatic components and other MRO machinery supplies.',
  },
};

function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('');

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
          slug: item.slug || '',
          metaTitle: item.meta_title || '',
          metaDescription: item.meta_description || '',
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
      const cleanCategory = categoryAliases[product.category.trim()] || product.category.trim();

      if (!grouped[cleanCategory]) grouped[cleanCategory] = [];
      grouped[cleanCategory].push(product);
    });

    // Always show the official fixed categories (even if currently empty),
    // PLUS any other category name that actually has active products — so a
    // product never silently disappears just because its category text
    // doesn't exactly match the fixed list (e.g. from a bulk import that
    // used a slightly different category name).
    const extraCategoryNames = Object.keys(grouped).filter(
      (name) => !fixedCategories.includes(name)
    );
    const allCategoryNames = [...fixedCategories, ...extraCategoryNames];

    return allCategoryNames.map((name) => ({
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
      categoryFromUrl === ALL_PRODUCTS_VALUE ||
      (categoryFromUrl && categories.some((cat) => cat.name === categoryFromUrl))
    ) {
      setSelectedCategory(categoryFromUrl);
      if (subCategoryFromUrl) setSelectedSubCategory(subCategoryFromUrl);
    }
  }, [categories]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, selectedSubCategory, searchQuery, selectedMake]);

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

  const makeOptions = useMemo(() => {
    const sourceProducts = currentCategory ? currentCategory.items : products;

    return [
      ...new Set(
        sourceProducts.map((item) => item.make).filter(Boolean)
      ),
    ].sort();
  }, [currentCategory, products]);

  const filteredProducts = useMemo(() => {
    let list = currentCategory ? currentCategory.items : products;

    if (selectedSubCategory) {
      list = list.filter((item) => item.subCategory === selectedSubCategory);
    }

    if (selectedMake) {
      list = list.filter((item) => item.make === selectedMake);
    }

    if (searchQuery.trim()) {
      const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

      list = list.filter((item) => {
        const text = [
          item.name,
          item.partNo,
          item.make,
          item.category,
          item.subCategory,
          item.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return queryWords.every((word) => wordMatchesText(word, text));
      });
    }

    return list;
  }, [
    currentCategory,
    products,
    selectedSubCategory,
    selectedMake,
    searchQuery,
  ]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = filteredProducts.length > visibleCount;

  const changeCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory(null);
    setSelectedMake('');
    setVisibleCount(PRODUCTS_PER_PAGE);

    window.history.pushState(
      {},
      '',
      `/products?category=${encodeURIComponent(categoryName)}`
    );
  };

  const changeSubCategory = (subCategoryName) => {
    setSelectedSubCategory(subCategoryName);
    setVisibleCount(PRODUCTS_PER_PAGE);

    if (subCategoryName) {
      window.history.pushState(
        {},
        '',
        `/products?category=${encodeURIComponent(
          selectedCategory
        )}&subCategory=${encodeURIComponent(subCategoryName)}`
      );
    } else if (selectedCategory) {
      window.history.pushState(
        {},
        '',
        `/products?category=${encodeURIComponent(selectedCategory)}`
      );
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedMake('');
    setSearchQuery('');
    setVisibleCount(PRODUCTS_PER_PAGE);
    window.history.pushState({}, '', '/products');
  };

  const getWhatsappMessage = (item, categoryName) => {
    const details = [];

    if (item.partNo) details.push(`Part Number: ${item.partNo}`);
    if (item.make) details.push(`Make: ${item.make}`);
    if (item.subCategory) details.push(`Sub Category: ${item.subCategory}`);

    return `Hello MR Apex Industrial Components, I need quotation for ${
      item.name
    }. Category: ${categoryName || item.category || 'Industrial Parts'}.${
      details.length ? ` ${details.join('. ')}` : ''
    }`;
  };

  const openQuoteForm = (item, categoryName) => {
    setSelectedProduct({ ...item, category: categoryName || item.category });
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
      productName: selectedProduct.product_name || selectedProduct.name || '',
      partNo: selectedProduct.part_number || selectedProduct.partNo || '',
      category: selectedProduct.category || '',
      subCategory:
        selectedProduct.sub_category || selectedProduct.subCategory || '',
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

  return (
    <>
      <Helmet>
        <title>
          Products | Industrial Parts Catalogue | MR Apex Industrial Components
        </title>
        <meta
          name="description"
          content="Browse hydraulic pumps, valves, fittings, hose pipes, couplings, Volvo parts, MSV spares and industrial machinery components. Submit RFQ for OEM, aftermarket and hard-to-find industrial parts across India."
        />
      </Helmet>

      <Header />

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 container-custom py-14 md:py-18">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 mb-5">
                  <Boxes className="w-4 h-4" />
                  Industrial Product Catalogue
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5">
                  Source Industrial Parts, OEM Components & Machinery Spares
                </h1>

                <p className="text-white/70 text-lg leading-relaxed max-w-3xl mb-7">
                  Browse listed products or submit your RFQ for hydraulic pumps,
                  valves, fittings, hose pipes, couplings, Volvo parts, MSV
                  spares and hard-to-find industrial components across India.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#products-list"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary/90 transition-colors"
                  >
                    Browse Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>

                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-extrabold text-white hover:bg-white/10 transition-colors"
                  >
                    Submit Industrial RFQ
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h2 className="text-xl font-extrabold mb-5">
                  Sourcing Support Includes
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'OEM Components',
                    'Aftermarket Options',
                    'Hydraulic Parts',
                    'Volvo Parts',
                    'MSV Spares',
                    'Bulk Procurement',
                    'Part Number Search',
                    'Image Based RFQ',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl bg-slate-900/70 border border-white/10 px-3 py-3 text-sm font-semibold text-white/80"
                    >
                      <BadgeCheck className="w-4 h-4 text-blue-300 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="products-list" className="section-padding bg-muted/50">
          <div className="container-custom">
            {(currentCategory ||
              searchQuery ||
              selectedMake ||
              selectedCategory === ALL_PRODUCTS_VALUE) && (
            <div className="mb-8 rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    Search & Filter Products
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Search by product name, part number, make, category or
                    description.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-3">
                <div className="relative">
                  <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product, part number, make..."
                    className="w-full border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <select
                  value={selectedCategory || ''}
                  onChange={(e) => {
                    if (e.target.value) changeCategory(e.target.value);
                    else clearFilters();
                  }}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name} ({category.items.length})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Makes</option>
                  {makeOptions.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="h-12 rounded-xl"
                >
                  Clear
                </Button>
              </div>

              {currentCategory && subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => changeSubCategory(null)}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                      !selectedSubCategory
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-foreground hover:bg-muted'
                    }`}
                  >
                    All {currentCategory.name}
                  </button>

                  {subCategories.map((subCategory) => (
                    <button
                      key={subCategory}
                      type="button"
                      onClick={() => changeSubCategory(subCategory)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        selectedSubCategory === subCategory
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-foreground hover:bg-muted'
                      }`}
                    >
                      {subCategory}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}

            {loading ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Loading products...
              </div>
            ) : !currentCategory && !searchQuery && !selectedMake && selectedCategory !== ALL_PRODUCTS_VALUE ? (
              <div>
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-primary font-semibold mb-1">
                      Browse Categories
                    </p>
                    <h2 className="text-3xl font-extrabold text-foreground">
                      Industrial Product Categories
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <motion.button
                    type="button"
                    onClick={() => changeCategory(ALL_PRODUCTS_VALUE)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35 }}
                    className="group bg-primary/5 rounded-3xl p-6 shadow-sm border-2 border-primary/20 text-left hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                      <Boxes className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                    </div>

                    <h2 className="text-xl font-extrabold mb-3 text-foreground">
                      All Products
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Browse every product we supply, across all categories, in one list.
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-muted-foreground">
                        {products.length} products
                      </span>

                      <span className="text-primary font-bold text-sm">
                        View →
                      </span>
                    </div>
                  </motion.button>

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
                        transition={{
                          duration: 0.35,
                          delay: Math.min(index, 6) * 0.04,
                        }}
                        className="group bg-white rounded-3xl p-6 shadow-sm border text-left hover:shadow-xl hover:-translate-y-1 transition-all"
                      >
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                          <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                        </div>

                        <h2 className="text-xl font-extrabold mb-3 text-foreground">
                          {category.name}
                        </h2>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {category.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground">
                            {category.items.length} products
                          </span>

                          <span className="text-primary font-bold text-sm">
                            View →
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
                  <div>
                    <p className="text-primary font-semibold mb-1">
                      Product Results
                    </p>

                    <h2 className="text-3xl font-extrabold text-foreground">
                      {currentCategory
                        ? currentCategory.name
                        : 'All Industrial Products'}
                    </h2>

                    <p className="text-sm text-muted-foreground mt-2">
                      Showing {displayedProducts.length} of{' '}
                      {filteredProducts.length} matching products.
                    </p>
                  </div>

                  {(currentCategory || selectedCategory === ALL_PRODUCTS_VALUE) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Categories
                    </Button>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white border rounded-3xl p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Search className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="text-2xl font-extrabold text-foreground mb-3">
                      Can't find your required part?
                    </h3>

                    <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                      Submit your part number, machine details, drawing or
                      product image. Our sourcing team can help identify
                      suitable OEM or compatible aftermarket industrial
                      components.
                    </p>

                    <Button asChild className="rounded-xl">
                      <Link to="/contact">
                        Submit RFQ
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {displayedProducts.map((item, index) => {
                        const message = getWhatsappMessage(
                          item,
                          currentCategory?.name || item.category
                        );

                        return (
                          <motion.div
                            key={`${item.id || item.name}-${item.partNo || index}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.35,
                              delay: Math.min(index, 6) * 0.04,
                            }}
                            className="bg-white rounded-3xl overflow-hidden shadow-sm border flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all"
                          >
                            <div className="h-36 bg-gradient-to-br from-white to-slate-50 border-b overflow-hidden flex items-center justify-center">
                              <img
                                src={
                                  item.image ||
                                  'https://via.placeholder.com/500x350?text=Product+Image'
                                }
                                alt={item.name || 'Industrial Product'}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                width="500"
                                height="350"
                                className="w-full h-full object-contain p-6"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'https://via.placeholder.com/500x350?text=Product+Image';
                                }}
                              />
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                              <div className="flex flex-wrap gap-2 mb-3">
                                {item.category && (
                                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                    {item.category}
                                  </span>
                                )}

                                {item.subCategory && (
                                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                                    {item.subCategory}
                                  </span>
                                )}
                              </div>

                              <h2 className="text-xl font-extrabold text-foreground mb-3 leading-snug">
                                {item.name}
                              </h2>

                              <div className="text-sm text-muted-foreground mb-5 space-y-1.5">
                                {item.partNo && (
                                  <p>
                                    <span className="font-bold text-foreground">
                                      Part Number:
                                    </span>{' '}
                                    {item.partNo}
                                  </p>
                                )}

                                {item.make && (
                                  <p>
                                    <span className="font-bold text-foreground">
                                      Make:
                                    </span>{' '}
                                    {item.make}
                                  </p>
                                )}

                                {item.description && (
                                  <p className="pt-2 line-clamp-3">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <div className="mt-auto space-y-3">
                                <Button
                                  asChild
                                  variant="outline"
                                  className="w-full rounded-xl"
                                >
                                  <Link
                                    to={`/products/${
                                      item.slug ||
                                      makeSlug(
                                        `${item.name || ''} ${item.partNo || ''}`
                                      )
                                    }`}
                                  >
                                    View Details
                                  </Link>
                                </Button>

                                <Button
                                  asChild
                                  className="w-full rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white"
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
                                  className="w-full rounded-xl"
                                  onClick={() =>
                                    openQuoteForm(
                                      item,
                                      currentCategory?.name || item.category
                                    )
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

                    {hasMoreProducts && (
                      <div className="text-center mt-10">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() =>
                            setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)
                          }
                        >
                          Load More Products
                        </Button>

                        <p className="text-sm text-muted-foreground mt-3">
                          Showing {displayedProducts.length} of{' '}
                          {filteredProducts.length} products
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>

        <section className="bg-slate-950 text-white py-10">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-blue-300" />
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold mb-2">
                    Looking for a hard-to-find industrial part?
                  </h3>

                  <p className="text-white/65 leading-relaxed">
                    If the product is not listed, share your part number,
                    product image, drawing or machine details. MR Apex can help
                    identify suitable sourcing options.
                  </p>
                </div>
              </div>

              <Button asChild className="rounded-xl shrink-0">
                <Link to="/contact">
                  Submit Requirement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
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
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                required
                placeholder="Mobile / WhatsApp Number"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Email Optional"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Company Name"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                placeholder="Company Address"
                value={form.company_address}
                onChange={(e) =>
                  setForm({ ...form, company_address: e.target.value })
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

export default ProductsPage;