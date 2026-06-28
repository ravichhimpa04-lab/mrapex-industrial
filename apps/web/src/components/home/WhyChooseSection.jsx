import React from 'react';
import { motion } from 'framer-motion';

import { whyChooseItems } from './data';

function WhyChooseSection() {
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
            Why Choose MR Apex
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Built for Industrial Buyers & Procurement Teams
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed">
            MR Apex focuses on RFQ-based industrial sourcing, supplier
            coordination and practical procurement support for businesses that
            need reliable OEM, aftermarket and hard-to-find components.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {whyChooseItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group rounded-3xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors">
                  <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-extrabold text-foreground mb-2">
                  {item.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  Practical sourcing support for industrial requirements,
                  quotation handling and supplier availability coordination.
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseSection;