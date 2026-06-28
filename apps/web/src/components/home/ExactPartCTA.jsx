import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  FileText,
  MapPin,
  Package,
  SearchCheck,
  Settings,
  Wrench,
} from 'lucide-react';

const requirementItems = [
  { icon: Camera, text: 'Product Image' },
  { icon: FileText, text: 'Part Number' },
  { icon: Settings, text: 'Machine Make' },
  { icon: Wrench, text: 'Machine Model' },
  { icon: FileText, text: 'Technical Drawing' },
  { icon: Package, text: 'Quantity Required' },
  { icon: SearchCheck, text: 'Product Description' },
  { icon: MapPin, text: 'Delivery Location' },
];

const sourcingItems = [
  'OEM Replacement Parts',
  'Compatible Aftermarket Parts',
  'Hydraulic Components',
  'Industrial Machinery Spares',
  'Obsolete Parts',
  'Hard-to-Find Components',
  'Bulk Industrial Requirements',
  'Project Procurement',
];

const processSteps = [
  {
    title: 'Share Your Requirement',
    desc: 'Upload image, drawing, part number or machine details.',
  },
  {
    title: 'Our Team Reviews',
    desc: 'We identify suitable sourcing options through supplier network.',
  },
  {
    title: 'Receive Quotation',
    desc: 'Get availability details and quotation based on your requirement.',
  },
  {
    title: 'Supply & Delivery',
    desc: 'After confirmation, we coordinate procurement and delivery.',
  },
];

function ExactPartCTA() {
  return (
    <section className="section-padding bg-muted/40">
      <div className="container-custom">
        <div className="rounded-[2rem] bg-slate-950 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 p-6 md:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <p className="text-blue-300 font-semibold mb-2">
                  Hard-to-Find Industrial Parts
                </p>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
                  Can&apos;t Find the Exact Industrial Part You&apos;re Looking
                  For?
                </h2>

                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  Don&apos;t worry. Our catalogue represents only a part of what
                  we can source. Share your requirement, and our team will help
                  identify suitable OEM or compatible aftermarket industrial
                  components through our supplier network.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requirementItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.text}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-300" />
                        </div>
                        <span className="text-sm font-semibold text-white/85">
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 backdrop-blur"
              >
                <h3 className="text-2xl font-extrabold mb-5">
                  We Help You Source
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {sourcingItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-3 text-sm font-semibold text-white/82"
                    >
                      <BadgeCheck className="w-4 h-4 text-blue-300 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {processSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-white">
                          {step.title}
                        </h4>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#rfq-form"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                  >
                    Request Industrial RFQ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>

                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Browse Catalogue
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExactPartCTA;