
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Factory, Car, Settings, BatteryCharging, Building2, HardHat, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function IndustriesPage() {
  const industries = [
    {
      icon: Factory,
      name: 'Manufacturing',
      description: 'Comprehensive component solutions for general manufacturing facilities, production machinery, and assembly operations. We ensure your production lines never stop due to missing parts.',
    },
    {
      icon: Car,
      name: 'Automotive',
      description: 'Precision components for vehicle manufacturing and assembly. From high-strength fasteners to specialized bearings, we supply parts that meet strict automotive industry standards.',
    },
    {
      icon: Settings,
      name: 'Engineering',
      description: 'Supporting heavy and light engineering sectors with reliable components. We provide custom-machined parts and standard supplies for complex engineering projects.',
    },
    {
      icon: BatteryCharging,
      name: 'Power & Energy',
      description: 'Specialized components for power generation and distribution. Our electrical components and robust fasteners are designed to withstand demanding energy sector environments.',
    },
    {
      icon: Building2,
      name: 'Construction',
      description: 'Heavy-duty components for construction equipment and structural applications. We supply bulk fasteners and MRO items for large-scale infrastructure projects.',
    },
    {
      icon: HardHat,
      name: 'Industrial Maintenance',
      description: 'Rapid response supply for plant maintenance and repair operations. We provide the critical MRO supplies needed to minimize equipment downtime.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Industries Served - MRAPEX</title>
        <meta name="description" content="MRAPEX serves diverse industries including Manufacturing, Automotive, Engineering, Power & Energy, Construction, and Industrial Maintenance." />
      </Helmet>

      <Header />

      <main>
        <section className="py-20 bg-muted">
          <div className="container-custom text-center max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground"
            >
              Industries We Serve
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed"
            >
              MRAPEX provides specialized industrial component solutions across diverse sectors. Our deep understanding of industry-specific requirements ensures you get the right parts for your applications.
            </motion.p>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {industries.map((industry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row gap-6 bg-card rounded-2xl p-8 shadow-sm border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <industry.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-3 text-foreground">{industry.name}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {industry.description}
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" /> Industry-compliant parts
                      </li>
                      <li className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" /> Reliable supply chain
                      </li>
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container-custom text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Need components for your specific industry?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Our technical team works closely with clients to understand specific application needs and recommend the most suitable components.
            </p>
            <Button size="lg" variant="secondary" asChild className="bg-white text-primary hover:bg-gray-100">
              <Link to="/contact">Discuss Your Requirements</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default IndustriesPage;
