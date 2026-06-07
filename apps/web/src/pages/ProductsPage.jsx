
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, Cog, Droplets, Gauge, Package, Settings, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function ProductsPage() {
  const products = [
    {
      icon: Truck,
      name: 'Volvo Parts',
      description: 'Volvo machinery parts, replacement components, engine parts, hydraulic parts, electrical parts and industrial spares.',
    },
    {
      icon: Settings,
      name: 'Fittings',
      description: 'Hydraulic fittings, pneumatic fittings, hose fittings, tube fittings and industrial connector solutions.',
    },
    {
      icon: Cog,
      name: 'Couplings',
      description: 'Quick release couplings, hydraulic couplings, pneumatic couplings and industrial coupling solutions.',
    },
    {
      icon: Droplets,
      name: 'Pumps',
      description: 'Hydraulic pumps, gear pumps, piston pumps, vane pumps and other industrial pump solutions.',
    },
    {
      icon: Gauge,
      name: 'Valves',
      description: 'Solenoid valves, directional control valves, pressure valves, flow control valves and hydraulic valves.',
    },
    {
      icon: Wrench,
      name: 'MSV Spare',
      description: 'MSV spare parts, seal kits, repair kits, replacement components and machinery maintenance items.',
    },
    {
      icon: Package,
      name: 'Other Machinery Items',
      description: 'Bearings, fasteners, filters, sensors, electrical components and other MRO machinery supplies.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Products - MR Apex Industrial Components</title>
        <meta
          name="description"
          content="Volvo Parts, Fittings, Couplings, Pumps, Valves, MSV Spare and Other Machinery Items from MR Apex Industrial Components."
        />
      </Helmet>

      <Header />

      <main>
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container-custom text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
            >
              Product Categories
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl opacity-90 leading-relaxed"
            >
              We source and supply industrial components, machinery parts and MRO supplies through a reliable supplier network.
            </motion.p>
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-8 shadow-sm border flex flex-col h-full"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <product.icon className="w-8 h-8 text-primary" />
                  </div>

                  <h2 className="text-2xl font-bold mb-4 text-foreground">
                    {product.name}
                  </h2>

                  <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                    {product.description}
                  </p>

                  <Button asChild className="w-full mt-auto">
                    <Link to="/contact">Product Enquiry</Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-accent text-accent-foreground">
          <div className="container-custom text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Need a specific industrial component?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Share your requirement, part number, sample image or product details. Our team will help you source the right item.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">Request a Quote</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ProductsPage;