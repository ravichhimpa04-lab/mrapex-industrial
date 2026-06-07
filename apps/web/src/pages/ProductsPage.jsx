
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Truck,
  Settings,
  Cog,
  Droplets,
  Gauge,
  Wrench,
  Package,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function ProductsPage() {
  const whatsappNumber = '919602338804';
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      name: 'Volvo Parts',
      icon: Truck,
      description: 'Volvo machinery parts, engine parts, hydraulic parts and replacement spares.',
      items: [
        {
          name: 'Volvo Hydraulic Pump',
          partNo: 'VOL-PMP-001',
          image: 'https://via.placeholder.com/500x350?text=Volvo+Hydraulic+Pump',
        },
        {
          name: 'Volvo Engine Sensor',
          partNo: 'VOL-SEN-002',
          image: 'https://via.placeholder.com/500x350?text=Volvo+Engine+Sensor',
        },
        {
          name: 'Volvo Seal Kit',
          partNo: 'VOL-SEAL-003',
          image: 'https://via.placeholder.com/500x350?text=Volvo+Seal+Kit',
        },
        {
          name: 'Bosch DEF Supply Modu',
          model: '044404228K',
          Function: 'Adblue pressure & delivery control',
          image: '/images/pump-unit-scr.jpg',
        },
      ],
    },
    {
      name: 'Fittings',
      icon: Settings,
      description: 'Hydraulic fittings, hose fittings, pneumatic fittings and tube fittings.',
      items: [
        {
          name: 'Hydraulic Hose Fitting',
          partNo: 'FIT-HYD-001',
          image: 'https://via.placeholder.com/500x350?text=Hydraulic+Fitting',
        },
        {
          name: 'Elbow Fitting',
          partNo: 'FIT-ELB-002',
          image: 'https://via.placeholder.com/500x350?text=Elbow+Fitting',
        },
      ],
    },
    {
      name: 'Couplings',
      icon: Cog,
      description: 'Quick release couplings, hydraulic couplings and industrial couplings.',
      items: [
        {
          name: 'Quick Release Coupling',
          partNo: 'CPL-QRC-001',
          image: 'https://via.placeholder.com/500x350?text=Quick+Release+Coupling',
        },
        {
          name: 'Hydraulic Coupling',
          partNo: 'CPL-HYD-002',
          image: 'https://via.placeholder.com/500x350?text=Hydraulic+Coupling',
        },
      ],
    },
    {
      name: 'Pumps',
      icon: Droplets,
      description: 'Hydraulic pumps, gear pumps, piston pumps and industrial pump solutions.',
      items: [
        {
          name: 'Gear Pump',
          partNo: 'PMP-GEAR-001',
          image: 'https://via.placeholder.com/500x350?text=Gear+Pump',
        },
        {
          name: 'Hydraulic Pump',
          partNo: 'PMP-HYD-002',
          image: 'https://via.placeholder.com/500x350?text=Hydraulic+Pump',
        },
      ],
    },
    {
      name: 'Valves',
      icon: Gauge,
      description: 'Solenoid valves, pressure valves, flow control valves and directional valves.',
      items: [
        {
          name: 'Solenoid Valve',
          partNo: 'VLV-SOL-001',
          image: 'https://via.placeholder.com/500x350?text=Solenoid+Valve',
        },
        {
          name: 'Directional Control Valve',
          partNo: 'VLV-DCV-002',
          image: 'https://via.placeholder.com/500x350?text=Directional+Control+Valve',
        },
      ],
    },
    {
      name: 'MSV Spare',
      icon: Wrench,
      description: 'MSV spare parts, seal kits, repair kits and machinery replacement items.',
      items: [
        {
          name: 'MSV Spare Kit',
          partNo: 'MSV-KIT-001',
          image: 'https://via.placeholder.com/500x350?text=MSV+Spare+Kit',
        },
        {
          name: 'MSV Repair Kit',
          partNo: 'MSV-REP-002',
          image: 'https://via.placeholder.com/500x350?text=MSV+Repair+Kit',
        },
      ],
    },
    {
      name: 'Other Machinery Items',
      icon: Package,
      description: 'Bearings, fasteners, filters, sensors and other MRO machinery supplies.',
      items: [
        {
          name: 'Industrial Bearing',
          partNo: 'OTH-BRG-001',
          image: 'https://via.placeholder.com/500x350?text=Industrial+Bearing',
        },
        {
          name: 'Machinery Filter',
          partNo: 'OTH-FLT-002',
          image: 'https://via.placeholder.com/500x350?text=Machinery+Filter',
        },
      ],
    },
  ];

  const currentCategory = categories.find((cat) => cat.name === selectedCategory);

  return (
    <>
      <Helmet>
        <title>Products - MR Apex Industrial Components</title>
        <meta
          name="description"
          content="Browse Volvo Parts, Fittings, Couplings, Pumps, Valves, MSV Spare and Other Machinery Items from MR Apex Industrial Components."
        />
      </Helmet>

      <Header />

      <main>
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container-custom text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {currentCategory ? currentCategory.name : 'Our Product Categories'}
            </h1>
            <p className="text-lg md:text-xl opacity-90 leading-relaxed">
              {currentCategory
                ? currentCategory.description
                : 'Select a category to view available products, part numbers and enquiry options.'}
            </p>
          </div>
        </section>

        <section className="section-padding bg-muted/50">
          <div className="container-custom">
            {!currentCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category, index) => {
                  const Icon = category.icon;

                  return (
                    <motion.button
                      key={category.name}
                      type="button"
                      onClick={() => setSelectedCategory(category.name)}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="bg-card rounded-2xl p-8 shadow-sm border text-left hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>

                      <h2 className="text-2xl font-bold mb-4 text-foreground">
                        {category.name}
                      </h2>

                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {category.description}
                      </p>

                      <span className="text-primary font-semibold">
                        View Products →
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCategory(null)}
                  className="mb-8"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Categories
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {currentCategory.items.map((item, index) => {
                    const message = `Hello MR Apex Industrial Components, I need quotation for ${item.name}. Category: ${currentCategory.name}. Part No: ${item.partNo}`;

                    return (
                      <motion.div
                        key={item.partNo}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.08 }}
                        className="bg-card rounded-2xl overflow-hidden shadow-sm border flex flex-col h-full"
                      >
                        <div className="h-56 bg-white border-b overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain p-4"
                          />
                        </div>

                        <div className="p-6 flex flex-col flex-grow">
                          <p className="text-sm font-semibold text-primary mb-2">
                            {currentCategory.name}
                          </p>

                          <h2 className="text-xl font-bold text-foreground mb-3">
                            {item.name}
                          </h2>

                          <p className="text-sm text-muted-foreground mb-6">
                            Part No:{' '}
                            <span className="font-semibold text-foreground">
                              {item.partNo}
                            </span>
                          </p>

                          <Button
                            asChild
                            className="w-full mt-auto bg-[#25D366] hover:bg-[#20bd5a] text-white"
                          >
                            <a
                              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Enquire on WhatsApp
                            </a>
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ProductsPage;