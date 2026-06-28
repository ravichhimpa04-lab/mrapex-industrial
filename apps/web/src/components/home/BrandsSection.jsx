import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Info } from 'lucide-react';

import { supportedBrands } from './data';

function BrandsSection() {
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
            Brands We Support
          </p>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Sourcing Support for Leading Machinery & Component Brands
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed">
            We assist customers in sourcing OEM and compatible aftermarket
            replacement parts for a wide range of industrial machinery and
            equipment brands based on availability and customer requirements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Object.entries(supportedBrands).map(([group, brands], index) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="rounded-3xl border bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                </div>

                <h3 className="text-xl font-extrabold text-foreground">
                  {group}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-full border bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mt-10 rounded-3xl border border-primary/15 bg-white p-6 md:p-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Info className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-extrabold text-foreground mb-3">
                Brand Compatibility & Sourcing Note
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                Brand names are used only to indicate sourcing capability and
                product compatibility. MR Apex Industrial Components supplies
                genuine OEM or compatible aftermarket parts based on customer
                requirements and product availability.
              </p>
            </div>

            <a
              href="#rfq-form"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Request Brand-wise RFQ
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default BrandsSection;