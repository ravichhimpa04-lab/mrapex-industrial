import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck } from 'lucide-react';

import { industries } from './data';

const industryDetails = {
  Manufacturing: [
    'Production Machinery',
    'Hydraulic Systems',
    'Plant Maintenance',
  ],
  Construction: [
    'Excavators',
    'Loaders',
    'Road Equipment',
  ],
  Mining: [
    'Heavy Equipment Parts',
    'Hydraulic Components',
    'Replacement Assemblies',
  ],
  Engineering: [
    'Machine Components',
    'Industrial Hardware',
    'Custom Procurement',
  ],
  'Power & Energy': [
    'Industrial Pumps',
    'Valves',
    'Mechanical Components',
  ],
  Automotive: [
    'Factory Maintenance',
    'Hydraulic Spares',
    'Power Transmission',
  ],
  Infrastructure: [
    'Bulk Procurement',
    'Project Supply',
    'Multi-location Support',
  ],
  'Industrial Maintenance': [
    'MRO Spares',
    'Breakdown Support',
    'Replacement Parts',
  ],
};

function IndustriesSection() {
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
            Industries We Support
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Supporting Industrial Procurement Across Multiple Sectors
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed">
            MR Apex Industrial Components helps businesses source industrial
            machinery parts, hydraulic components and OEM replacement products
            for a wide range of industries across India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            const details = industryDetails[industry.title] || [];

            return (
              <motion.div
                key={industry.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group rounded-3xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                  <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-extrabold text-foreground mb-4">
                  {industry.title}
                </h3>

                <div className="space-y-2">
                  {details.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mt-10 rounded-3xl border border-primary/15 bg-primary/5 p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
                Industrial Procurement Partner for Every Industry
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                Whether your requirement is for planned maintenance, urgent
                machine breakdown, OEM replacement or project procurement, MR
                Apex works with a trusted supplier network to help industries
                source the right industrial components across India.
              </p>
            </div>

            <a
              href="#rfq-form"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Need Parts for Your Industry?
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default IndustriesSection;