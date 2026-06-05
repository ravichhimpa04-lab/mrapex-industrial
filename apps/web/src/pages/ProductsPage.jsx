
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, Cog, Zap, Package, Settings, Sparkles, Wrench as ToolIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function ProductsPage() {
  const products = [
    {
      icon: Wrench,
      name: 'Fasteners',
      description: 'High-quality industrial fasteners, bolts, nuts, screws for manufacturing. Available in various grades and materials to meet stringent industrial standards.',
    },
    {
      icon: Cog,
      name: 'Bearings',
      description: 'Precision bearings for machinery and industrial equipment. We supply ball bearings, roller bearings, and specialty bearings for high-load applications.',
    },
    {
      icon: Zap,
      name: 'Electrical Components',
      description: 'Switches, contactors, relays, and electrical supplies. Reliable components for power distribution, control panels, and industrial automation.',
    },
    {
      icon: ToolIcon,
      name: 'Pneumatic Components',
      description: 'Air cylinders, valves, and pneumatic systems. Essential components for automated manufacturing and assembly line operations.',
    },
    {
      icon: Package,
      name: 'MRO Supplies',
      description: 'Maintenance, repair, and operations supplies. Everything you need to keep your facility running smoothly and minimize downtime.',
    },
    {
      icon: Sparkles,
      name: 'Custom Engineering Parts',
      description: 'Customized industrial components and solutions. Precision-machined parts manufactured to your exact specifications and drawings.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Products - MRAPEX Industrial Components</title>
        <meta name="description" content="Browse MRAPEX's comprehensive range of industrial components including fasteners, bearings, electrical components, pneumatic parts, and MRO supplies." />
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
              Industrial Products & Supplies
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl opacity-90 leading-relaxed"
            >
              We source and supply a comprehensive range of high-quality industrial components to keep your manufacturing operations running efficiently.
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
                  <h2 className="text-2xl font-bold mb-4 text-foreground">{product.name}</h2>
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
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Don't see what you're looking for?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Our sourcing network extends beyond our standard catalog. Contact us with your specific requirements and we'll find the right solution for you.
            </p>
            <Button size="lg" variant="secondary" asChild className="bg-white text-accent hover:bg-gray-100">
              <Link to="/contact">Send Custom Request</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ProductsPage;
