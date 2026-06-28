import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Factory,
  FileSearch,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function AboutUsPage() {
  const sourcingFocus = [
    {
      icon: PackageCheck,
      title: 'OEM Parts Sourcing',
      desc: 'Support for genuine industrial and machinery replacement parts based on part number, make, model and availability.',
    },
    {
      icon: Boxes,
      title: 'Aftermarket Components',
      desc: 'Compatible replacement options for industrial machinery, maintenance teams and procurement departments.',
    },
    {
      icon: Wrench,
      title: 'Hard-to-Find Parts',
      desc: 'RFQ based sourcing support for components that are not easily available in standard catalogues.',
    },
    {
      icon: Truck,
      title: 'Pan India Supply Support',
      desc: 'Industrial sourcing and supply coordination for buyers across major industrial regions in India.',
    },
  ];

  const processSteps = [
    {
      title: 'Share Requirement',
      desc: 'Customer shares part number, product image, drawing, machine details or RFQ list.',
    },
    {
      title: 'Requirement Review',
      desc: 'MR Apex reviews the requirement and checks possible OEM or aftermarket sourcing options.',
    },
    {
      title: 'Quotation Support',
      desc: 'Availability, pricing and procurement details are shared based on supplier confirmation.',
    },
    {
      title: 'Supply Coordination',
      desc: 'After confirmation, procurement and delivery coordination is handled as per buyer requirement.',
    },
  ];

  const whyChooseItems = [
    'Industrial procurement focused approach',
    'OEM and aftermarket sourcing options',
    'Support for urgent breakdown requirements',
    'RFQ based quotation process',
    'Pan India supplier network coordination',
    'Industrial buyer assistance for product identification',
    'Bulk procurement and project requirement support',
    'Clear communication for sourcing availability',
  ];

  const industries = [
    'Manufacturing Plants',
    'Construction Equipment',
    'Mining & Heavy Machinery',
    'Engineering Workshops',
    'Industrial Maintenance Teams',
    'Infrastructure Projects',
    'Automotive & Fabrication Units',
    'Power & Process Industries',
  ];

  return (
    <>
      <Helmet>
        <title>
          About MR Apex | Industrial Procurement & Sourcing Partner Across India
        </title>
        <meta
          name="description"
          content="MR Apex Industrial Components is an industrial procurement and sourcing company helping businesses source OEM, aftermarket and hard-to-find machinery parts across India."
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
                  <Factory className="w-4 h-4" />
                  Industrial Procurement & Sourcing Partner
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                  Helping Industries Source the Right Industrial Components
                  Across India
                </h1>

                <p className="text-white/72 text-lg leading-relaxed max-w-3xl mb-7">
                  MR Apex Industrial Components helps manufacturers,
                  contractors, maintenance teams and industrial buyers source
                  OEM, aftermarket and hard-to-find machinery components through
                  a trusted supplier network across India.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="h-12 rounded-xl">
                    <Link to="/contact">
                      Submit Industrial Requirement
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link to="/products">Explore Product Catalogue</Link>
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
                  What MR Apex Focuses On
                </h2>

                <div className="space-y-3">
                  {[
                    'Industrial parts sourcing',
                    'OEM and aftermarket procurement',
                    'Hydraulic components and machinery spares',
                    'Volvo parts, MSV spares and MRO supplies',
                    'RFQ based quotation and buyer assistance',
                    'Pan India supply coordination',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
                    >
                      <BadgeCheck className="w-5 h-5 text-blue-300 shrink-0" />
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

        <section className="section-padding bg-white">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <p className="text-primary font-semibold mb-2">
                Company Positioning
              </p>

              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
                Not Just a Product Seller — An Industrial Sourcing Partner
              </h2>

              <p className="text-muted-foreground text-lg leading-relaxed">
                Many industrial requirements are not limited to standard
                catalogue items. MR Apex focuses on helping buyers identify,
                source and procure the required components based on technical
                details, part numbers, product images, machinery application and
                availability.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {sourcingFocus.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.05 }}
                    className="group rounded-3xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                      <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>

                    <h3 className="text-xl font-extrabold text-foreground mb-3">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted/40">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-start">
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <p className="text-primary font-semibold mb-2">
                  Our Procurement Process
                </p>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
                  Simple RFQ Based Industrial Sourcing Workflow
                </h2>

                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  MR Apex works around customer requirements. Whether you have a
                  part number, product photo, technical drawing, machine model or
                  only a basic description, our team reviews the requirement and
                  supports sourcing where possible.
                </p>

                <div className="rounded-3xl bg-slate-950 text-white p-6">
                  <h3 className="text-xl font-extrabold mb-3">
                    You can send us:
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Part Number',
                      'Product Image',
                      'Technical Drawing',
                      'Machine Make / Model',
                      'Quantity Requirement',
                      'Delivery Location',
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
                className="space-y-4"
              >
                {processSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-3xl border bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-extrabold shrink-0">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="text-xl font-extrabold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-start">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>

                <h2 className="text-3xl font-extrabold text-foreground mb-5">
                  Why Industrial Buyers Choose MR Apex
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {whyChooseItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 rounded-2xl bg-muted/40 border p-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="rounded-3xl border bg-muted/40 p-6 md:p-8"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>

                <h2 className="text-3xl font-extrabold text-foreground mb-5">
                  Industries We Support
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-5">
                  MR Apex supports procurement teams, plant maintenance teams,
                  contractors and industrial buyers across multiple sectors.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {industries.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl bg-white border p-3"
                    >
                      <Factory className="w-4 h-4 text-primary shrink-0" />
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <p className="text-blue-300 font-semibold mb-2">
                  Pan India Industrial Sourcing
                </p>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
                  Based in Jaipur. Supporting Industrial Requirements Across
                  India.
                </h2>

                <p className="text-white/70 text-lg leading-relaxed mb-7">
                  MR Apex Industrial Components operates from Jaipur, Rajasthan
                  and supports industrial procurement requirements across India
                  through supplier coordination and RFQ based sourcing support.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Jaipur Based Operations',
                    'Pan India Supply Support',
                    'Industrial Buyer Assistance',
                    'RFQ Based Procurement',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm font-semibold text-white/80"
                    >
                      <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-2xl font-extrabold mb-5">
                  Contact MR Apex
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Location</p>
                      <p className="text-white/65 text-sm">
                        Jaipur, Rajasthan, India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Email</p>
                      <a
                        href="mailto:info@mrapexindustrial.in"
                        className="text-white/65 text-sm hover:text-white"
                      >
                        info@mrapexindustrial.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-300 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">Response</p>
                      <p className="text-white/65 text-sm">
                        RFQ based response and quotation support
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button asChild className="h-12 rounded-xl">
                    <Link to="/contact">
                      Submit Requirement
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white"
                  >
                    <a
                      href="https://wa.me/919602338804?text=Hello%20MR%20Apex%20Industrial%20Components%2C%20I%20need%20industrial%20parts%20quotation."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp Requirement
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AboutUsPage;