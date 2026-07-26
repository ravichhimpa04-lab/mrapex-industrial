import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Send,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RFQForm from '@/components/RFQForm.jsx';

function ContactPage() {
  const enquiryTypes = [
    'Product quotation',
    'OEM part sourcing',
    'Aftermarket replacement',
    'Hydraulic components',
    'Volvo / heavy equipment parts',
    'MSV and machinery spares',
    'Bulk industrial procurement',
    'Hard-to-find component sourcing',
  ];

  const requirementItems = [
    'Product name or description',
    'Part number / OEM number',
    'Machine make and model',
    'Product image or drawing',
    'Quantity required',
    'Delivery location',
  ];

  const processSteps = [
    {
      icon: Send,
      title: 'Submit Requirement',
      desc: 'Share product details, part number, image, quantity or delivery location.',
    },
    {
      icon: PackageSearch,
      title: 'Sourcing Review',
      desc: 'Our team checks possible OEM or compatible aftermarket sourcing options.',
    },
    {
      icon: FileText,
      title: 'Quotation Support',
      desc: 'You receive availability and quotation details based on supplier confirmation.',
    },
    {
      icon: Truck,
      title: 'Supply Coordination',
      desc: 'After confirmation, procurement and delivery coordination is handled.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Contact MR Apex | Submit Industrial RFQ & Parts Requirement
        </title>
        <meta
          name="description"
          content="Contact MR Apex Industrial Components to submit RFQ for OEM, aftermarket, hydraulic, Volvo, MSV and hard-to-find industrial machinery parts across India."
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
                  <FileText className="w-4 h-4" />
                  Submit Industrial RFQ
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                  Share Your Industrial Parts Requirement
                </h1>

                <p className="text-white/72 text-lg leading-relaxed max-w-3xl mb-7">
                  Need OEM, aftermarket or hard-to-find industrial components?
                  Send your part number, product image, drawing, machine details
                  or quantity requirement. MR Apex will review and support your
                  sourcing request across India.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#rfq-form"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary/90 transition-colors"
                  >
                    Fill RFQ Form
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>

                  <a
                    href="https://wa.me/919602338804?text=Hello%20MR%20Apex%20Industrial%20Components%2C%20I%20need%20industrial%20parts%20quotation."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-extrabold text-white hover:bg-white/10 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Requirement
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h2 className="text-2xl font-extrabold mb-5">
                  You Can Enquire For
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enquiryTypes.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3"
                    >
                      <BadgeCheck className="w-4 h-4 text-blue-300 shrink-0" />
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

        <section id="rfq-form" className="section-padding bg-muted/40">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55 }}
                  className="rounded-3xl border bg-white p-6 shadow-sm"
                >
                  <p className="text-primary font-semibold mb-2">
                    Contact Details
                  </p>

                  <h2 className="text-3xl font-extrabold text-foreground mb-5">
                    MR Apex Industrial Components
                  </h2>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-foreground">
                          Location
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          Rajasthan
                          <br />
                          India
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-foreground">
                          Email
                        </h3>
                        <a
                          href="mailto:info@mrapexindustrial.in"
                          className="text-muted-foreground hover:text-primary transition-colors mt-1 block"
                        >
                          info@mrapexindustrial.in
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-foreground">
                          Phone / WhatsApp
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          Submit enquiry or send requirement on WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/919602338804?text=Hello%20MR%20Apex%20Industrial%20Components%2C%20I%20need%20industrial%20parts%20quotation."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center w-full gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-extrabold hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Requirement
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.08 }}
                  className="rounded-3xl bg-slate-950 text-white p-6"
                >
                  <h3 className="text-2xl font-extrabold mb-4">
                    Send Better RFQ Details
                  </h3>

                  <p className="text-white/65 leading-relaxed mb-5">
                    The more details you share, the faster our team can review
                    your sourcing requirement.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {requirementItems.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                        <span className="text-sm font-semibold text-white/80">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="lg:col-span-7"
              >
                <div className="mb-6">
                  <p className="text-primary font-semibold mb-2">
                    Request Quotation
                  </p>

                  <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
                    Submit Your Industrial RFQ
                  </h2>

                  <p className="text-muted-foreground leading-relaxed">
                    Fill out the form below with product details, part number,
                    quantity and delivery location. Our team will review your
                    requirement and get back with sourcing support.
                  </p>
                </div>

                <div className="rounded-3xl border bg-white p-4 shadow-xl">
                  <RFQForm />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <p className="text-primary font-semibold mb-2">
                How Enquiry Works
              </p>

              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-5">
                Simple RFQ Process for Industrial Buyers
              </h2>

              <p className="text-muted-foreground text-lg leading-relaxed">
                MR Apex follows a practical enquiry process focused on
                requirement review, sourcing availability and quotation support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {processSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: index * 0.05 }}
                    className="rounded-3xl border bg-white p-6 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>

                    <h3 className="text-xl font-extrabold text-foreground mb-3">
                      {index + 1}. {step.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white py-10">
          <div className="container-custom">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-blue-300" />
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
                    Need help identifying a part?
                  </h3>

                  <p className="text-white/65 leading-relaxed max-w-3xl">
                    Share available details like product image, part number,
                    machine make, model or drawing. MR Apex can help review the
                    requirement and suggest suitable sourcing options.
                  </p>
                </div>
              </div>

              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-extrabold text-white hover:bg-white/10 transition-colors shrink-0"
              >
                Browse Catalogue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ContactPage;