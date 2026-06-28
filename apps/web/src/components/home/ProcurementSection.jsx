import React from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Boxes,
  Factory,
  FileSearch,
  Gauge,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';

const procurementCards = [
  {
    icon: PackageCheck,
    title: 'OEM Industrial Parts',
    desc: 'Support for genuine replacement parts based on machine make, model, part number and availability.',
  },
  {
    icon: Boxes,
    title: 'Aftermarket Components',
    desc: 'Cost-effective compatible replacement options for machinery maintenance and repair requirements.',
  },
  {
    icon: Gauge,
    title: 'Hydraulic Components',
    desc: 'Sourcing support for pumps, valves, cylinders, hose assemblies, fittings, seals and gauges.',
  },
  {
    icon: Factory,
    title: 'Industrial MRO Supplies',
    desc: 'Procurement assistance for maintenance, repair and operational industrial components.',
  },
  {
    icon: Wrench,
    title: 'Breakdown Part Sourcing',
    desc: 'Support for urgent industrial part requirements where quick identification and availability matter.',
  },
  {
    icon: FileSearch,
    title: 'Bulk Procurement Support',
    desc: 'RFQ-based sourcing for project requirements, planned maintenance and multi-item industrial purchases.',
  },
];

const trustPoints = [
  'Pan India Industrial Sourcing',
  'Verified Supplier Network',
  'OEM & Aftermarket Support',
  'RFQ Based Procurement',
  'Industrial Buyer Assistance',
  'Fast Quotation Support',
];

function ProcurementSection() {
  return (
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
            Industrial Procurement Partner
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Your Industrial Procurement & Sourcing Partner Across India
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed">
            MR Apex Industrial Components helps businesses source OEM,
            aftermarket and hard-to-find industrial parts through a trusted
            supplier network across India. From urgent breakdown requirements to
            planned industrial procurement, we support reliable sourcing for a
            wide range of machinery and industrial applications.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {procurementCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
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
                  {card.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="rounded-3xl border border-primary/15 bg-primary/5 p-5 md:p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trustPoints.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 border shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-sm text-foreground">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-slate-950 text-white p-5">
            <div>
              <h3 className="text-xl font-extrabold mb-1">
                Need help sourcing an industrial component?
              </h3>
              <p className="text-white/65">
                Share part number, image, drawing or machine details for RFQ
                support.
              </p>
            </div>

            <a
              href="#rfq-form"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Send Requirement
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ProcurementSection;