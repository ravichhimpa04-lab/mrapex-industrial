import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  MapPinned,
  Route,
  Truck,
} from 'lucide-react';

import { supplyRegions } from './data';

const procurementSupport = [
  'Industrial Parts Sourcing',
  'OEM Components',
  'Aftermarket Alternatives',
  'Bulk Industrial Procurement',
  'Emergency Breakdown Support',
  'Multi-location Supply Coordination',
  'RFQ Handling',
  'Vendor Coordination',
];

function PanIndiaSection() {
  return (
    <section className="section-padding bg-slate-950 text-white overflow-hidden">
      <div className="container-custom relative">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute left-0 bottom-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative z-10 max-w-4xl mx-auto text-center mb-12"
        >
          <p className="text-blue-300 font-semibold mb-2">
            Pan India Industrial Supply Network
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5">
            Industrial Sourcing & Supply Across India
          </h2>

          <p className="text-white/70 text-lg leading-relaxed">
            MR Apex Industrial Components supports industrial buyers,
            maintenance teams, OEMs, contractors and procurement departments
            with industrial parts sourcing and supply solutions across major
            industrial cities in India.
          </p>
        </motion.div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <MapPinned className="w-7 h-7 text-blue-300" />
            </div>

            <h3 className="text-2xl md:text-3xl font-extrabold mb-4">
              From Jaipur to Major Industrial Hubs
            </h3>

            <p className="text-white/68 leading-relaxed mb-6">
              Whether your factory is in Jaipur, Pune, Chennai, Ahmedabad,
              Delhi NCR or any other industrial location, our team can help you
              identify and source required industrial components based on your
              requirement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {procurementSupport.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm font-semibold text-white/85"
                >
                  <BadgeCheck className="w-4 h-4 text-blue-300 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {supplyRegions.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Route className="w-5 h-5 text-blue-300" />
                  </div>

                  <h3 className="text-lg font-extrabold">
                    {region.region}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {region.cities.map((city) => (
                    <span
                      key={city}
                      className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-white/75"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative z-10 mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 max-w-3xl">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-300" />
              </div>

              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-3">
                  Need Industrial Parts Anywhere in India?
                </h3>

                <p className="text-white/68 leading-relaxed">
                  Share your industrial part requirement with part number,
                  machine details, image or delivery location. MR Apex will help
                  you identify suitable sourcing options through its supplier
                  network.
                </p>
              </div>
            </div>

            <a
              href="#rfq-form"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Send Your Requirement
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PanIndiaSection;