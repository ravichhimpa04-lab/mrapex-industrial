import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { capabilityCards } from './data';

function CapabilitySection() {
  return (
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
            Industrial Sourcing Capabilities
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Complete Industrial Parts Sourcing Under One Roof
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed">
            From OEM machinery components to aftermarket replacement parts, MR
            Apex supports industrial buyers with sourcing and supply solutions
            across multiple industries and machinery brands throughout India.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {capabilityCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group rounded-3xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      RFQ based sourcing support
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {card.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm font-medium text-foreground"
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
          className="mt-10 rounded-3xl bg-slate-950 text-white p-6 md:p-8 overflow-hidden relative"
        >
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <h3 className="text-2xl md:text-3xl font-extrabold mb-3">
                Can&apos;t find your required industrial part in our catalogue?
              </h3>

              <p className="text-white/70 leading-relaxed">
                Share your part number, machine details, drawing or product
                image. Our sourcing team will identify suitable OEM or
                aftermarket options through our supplier network.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#rfq-form"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                Request Industrial RFQ
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>

              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Browse Catalogue
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CapabilitySection;