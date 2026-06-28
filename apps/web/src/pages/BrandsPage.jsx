import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  Cog,
  Factory,
  Gauge,
  Info,
  MessageCircle,
  PackageSearch,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function BrandsPage() {
  const brandGroups = [
    {
      title: 'Heavy Equipment Brands',
      icon: Truck,
      brands: [
        'Volvo',
        'JCB',
        'Caterpillar',
        'Komatsu',
        'Hitachi',
        'Hyundai',
        'Kobelco',
        'Doosan',
        'SANY',
        'XCMG',
      ],
    },
    {
      title: 'Hydraulic Component Brands',
      icon: Gauge,
      brands: [
        'Bosch Rexroth',
        'Parker',
        'Danfoss',
        'Eaton',
        'Kawasaki',
        'Linde',
        'Yuken',
        'Nachi',
        'Vickers',
        'Tokimec',
        'Casappa',
        'Veljan',
        'Polyhydron',
        'Sunfab',
      ],
    },
    {
      title: 'Bearings & Power Transmission',
      icon: Cog,
      brands: [
        'SKF',
        'FAG',
        'NSK',
        'NTN',
        'Timken',
        'INA',
        'KOYO',
        'NACHI',
        'RHP',
        'FYH',
      ],
    },
    {
      title: 'Pumps & Industrial Equipment',
      icon: Wrench,
      brands: [
        'Grundfos',
        'KSB',
        'Kirloskar',
        'Flowserve',
        'Wilo',
        'Crompton',
        'CRI',
        'Texmo',
      ],
    },
    {
      title: 'Pneumatic & Automation Brands',
      icon: Boxes,
      brands: [
        'Festo',
        'SMC',
        'Airtac',
        'Janatics',
        'Norgren',
        'Camozzi',
        'Parker Pneumatics',
      ],
    },
    {
      title: 'Electrical & Industrial Brands',
      icon: Factory,
      brands: [
        'Siemens',
        'ABB',
        'Schneider Electric',
        'Mitsubishi Electric',
        'Omron',
        'L&T',
        'Havells',
        'BCH',
      ],
    },
  ];

  const sourcingSupport = [
    'OEM replacement parts',
    'Compatible aftermarket components',
    'Part number based sourcing',
    'Machine model based identification',
    'Hydraulic pumps, valves and fittings',
    'Volvo and heavy equipment parts',
    'Industrial MRO and maintenance spares',
    'Bulk RFQ and procurement support',
  ];

  return (
    <>
      <Helmet>
        <title>
          Brands We Support | Industrial Parts Sourcing Across India | MR Apex
        </title>
        <meta
          name="description"
          content="MR Apex supports sourcing requests for Volvo, JCB, Caterpillar, Bosch Rexroth, Parker, Danfoss, SKF, Siemens and other industrial machinery and component brands across India."
        />
      </Helmet>

      <Header />

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 container-custom py-16 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 mb-5">
                  <BadgeCheck className="w-4 h-4" />
                  Brand-wise Industrial Parts Sourcing
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                  Sourcing Support for Leading Industrial Machinery Brands
                </h1>

                <p className="text-white/72 text-lg leading-relaxed max-w-3xl mb-7">
                  MR Apex Industrial Components assists buyers in sourcing OEM
                  and compatible aftermarket replacement parts for heavy
                  equipment, hydraulic systems, bearings, pumps, automation and
                  industrial component brands across India.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="h-12 rounded-xl">
                    <Link to="/contact">
                      Request Brand-wise RFQ
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to="/products">Explore Products</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h2 className="text-2xl font-extrabold mb-5">
                  Brand Sourcing Support Includes
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sourcingSupport.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                      <span className="text-sm font-semibold text-white/85">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted/40">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <p className="text-primary font-semibold mb-2">
                Supported Brand Categories
              </p>

              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
                Brand-wise RFQ Support for Industrial Buyers
              </h2>

              <p className="text-muted-foreground text-lg leading-relaxed">
                Share your brand name, part number, machine model, product
                image or drawing. MR Apex can help review suitable OEM or
                compatible aftermarket sourcing options based on availability.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {brandGroups.map((group, index) => {
                const Icon = group.icon;

                return (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    className="rounded-3xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>

                      <h3 className="text-2xl font-extrabold text-foreground">
                        {group.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.brands.map((brand) => (
                        <span
                          key={brand}
                          className="rounded-full border bg-muted/50 px-4 py-2 text-sm font-bold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-start">
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <p className="text-primary font-semibold mb-2">
                  Brand Compatibility
                </p>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
                  OEM, Equivalent & Aftermarket Replacement Options
                </h2>

                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Industrial buyers often need parts by brand, model or part
                  number. MR Apex supports sourcing enquiries where the buyer is
                  looking for genuine OEM parts, compatible aftermarket options
                  or equivalent industrial components.
                </p>

                <div className="rounded-3xl bg-slate-950 text-white p-6">
                  <h3 className="text-xl font-extrabold mb-4">
                    You Can Send:
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Brand Name',
                      'Part Number',
                      'Machine Model',
                      'Product Image',
                      'Technical Drawing',
                      'Sample Reference',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm font-semibold text-white/80"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="rounded-3xl border bg-muted/40 p-6 md:p-8"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Info className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
                  Important Brand Note
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-5">
                  Brand names are used only to indicate sourcing capability,
                  product identification and compatibility. MR Apex Industrial
                  Components supplies genuine OEM or compatible aftermarket
                  parts based on customer requirements, supplier confirmation
                  and product availability.
                </p>

                <div className="space-y-3">
                  {[
                    'No unauthorized dealership claim',
                    'Availability depends on supplier confirmation',
                    'OEM and aftermarket options may vary',
                    'RFQ based quotation support',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl bg-white border p-3"
                    >
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-slate-950 text-white">
          <div className="container-custom">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-8 items-center">
                <div>
                  <p className="text-blue-300 font-semibold mb-2">
                    Brand-wise RFQ
                  </p>

                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
                    Looking for Parts of a Specific Brand?
                  </h2>

                  <p className="text-white/70 text-lg leading-relaxed mb-6">
                    Share your brand name, part number, product image, machine
                    make, model or drawing. MR Apex can help review sourcing
                    options for OEM or compatible aftermarket industrial parts.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="h-12 rounded-xl">
                      <Link to="/contact">
                        Submit Brand RFQ
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>

                    <Button
                      asChild
                      className="h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white"
                    >
                      <a
                        href="https://wa.me/919602338804?text=Hello%20MR%20Apex%20Industrial%20Components%2C%20I%20need%20brand-wise%20industrial%20parts%20quotation."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp Requirement
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      icon: PackageSearch,
                      title: 'Part Identification',
                    },
                    {
                      icon: Gauge,
                      title: 'Hydraulic Brands',
                    },
                    {
                      icon: Truck,
                      title: 'Heavy Equipment',
                    },
                    {
                      icon: Wrench,
                      title: 'MRO Sourcing',
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                      >
                        <Icon className="w-6 h-6 text-blue-300 mb-3" />
                        <h3 className="font-extrabold text-white">
                          {item.title}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default BrandsPage;