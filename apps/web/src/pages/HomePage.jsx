
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Wrench, Cog, Zap, Package, Settings, Sparkles, 
  Clock, Map, Truck, ShieldCheck, Factory, Car, 
  Building2, BatteryCharging, HardHat, Wrench as ToolIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RFQForm from '@/components/RFQForm.jsx';

function HomePage() {
  const trustIndicators = [
    { icon: Clock, title: 'Quick Quotation Support' },
    { icon: Map, title: 'PAN India Supplier Network' },
    { icon: Truck, title: 'Bulk Order Assistance' },
    { icon: Settings, title: 'Custom Industrial Sourcing' },
  ];

  const products = [
    { icon: Wrench, name: 'Fasteners', desc: 'High-quality industrial fasteners, bolts, nuts, screws for manufacturing.' },
    { icon: Cog, name: 'Bearings', desc: 'Precision bearings for machinery and industrial equipment.' },
    { icon: Zap, name: 'Electrical Components', desc: 'Switches, contactors, relays, and electrical supplies.' },
    { icon: ToolIcon, name: 'Pneumatic Components', desc: 'Air cylinders, valves, and pneumatic systems.' },
    { icon: Package, name: 'MRO Supplies', desc: 'Maintenance, repair, and operations supplies.' },
    { icon: Sparkles, name: 'Custom Engineering Parts', desc: 'Customized industrial components and solutions.' },
  ];

  const industries = [
    { icon: Factory, name: 'Manufacturing' },
    { icon: Car, name: 'Automotive' },
    { icon: Settings, name: 'Engineering' },
    { icon: BatteryCharging, name: 'Power & Energy' },
    { icon: Building2, name: 'Construction' },
    { icon: HardHat, name: 'Industrial Maintenance' },
  ];

  const benefits = [
    { icon: Zap, title: 'Competitive Pricing', desc: 'Best value for industrial-grade components.' },
    { icon: Map, title: 'Trusted Supplier Network', desc: 'Sourced from verified manufacturers.' },
    { icon: Clock, title: 'Fast Response Time', desc: 'Quick quotes and technical support.' },
    { icon: ShieldCheck, title: 'Reliable Quality', desc: 'Strict quality control standards.' },
    { icon: Settings, title: 'Technical Support', desc: 'Expert guidance for component selection.' },
    { icon: Truck, title: 'Nationwide Service', desc: 'Delivery across all major Indian cities.' },
  ];

  return (
    <>
      <Helmet>
        <title>MRAPEX - Industrial Components & MRO Supplies</title>
        <meta name="description" content="MRAPEX helps manufacturing companies source fasteners, bearings, electrical components, MRO supplies and custom engineering products across India." />
      </Helmet>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90dvh] flex items-center bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1610891015188-5369212db097)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-transparent" />
          <div className="relative z-10 container-custom py-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.7 }} 
              className="max-w-3xl text-white"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                Your Reliable Partner for Industrial Components & MRO Supplies
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-10 max-w-2xl">
                MRAPEX helps manufacturing companies source fasteners, bearings, electrical components, MRO supplies and custom engineering products through a trusted supplier network across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-white text-primary hover:bg-gray-100 text-base font-semibold h-14 px-8">
                  <Link to="/contact">Request a Quote</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10 text-base font-semibold h-14 px-8">
                  <Link to="/products">Product Enquiry</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {trustIndicators.map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3">
                  <item.icon className="w-8 h-8 opacity-80" />
                  <span className="font-medium text-sm md:text-base">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Our Product Categories</h2>
              <p className="text-muted-foreground text-lg">Comprehensive sourcing solutions for all your industrial needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <product.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{product.name}</h3>
                  <p className="text-muted-foreground mb-8 flex-grow">{product.desc}</p>
                  <Button variant="outline" asChild className="w-full mt-auto">
                    <Link to="/contact">Product Enquiry</Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Industries We Serve</h2>
                <p className="text-muted-foreground text-lg">Delivering specialized components across diverse manufacturing sectors.</p>
              </div>
              <Button asChild variant="ghost" className="text-primary">
                <Link to="/industries">View All Industries &rarr;</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {industries.map((ind, i) => (
                <div key={i} className="bg-muted rounded-xl p-6 text-center hover:bg-primary hover:text-primary-foreground transition-colors group cursor-pointer">
                  <ind.icon className="w-8 h-8 mx-auto mb-4 text-primary group-hover:text-primary-foreground transition-colors" />
                  <h3 className="font-semibold text-sm md:text-base">{ind.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Choose MRAPEX</h2>
              <p className="text-muted-foreground text-lg">We focus on quality, competitive pricing and fast response support.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RFQ Section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Request a Quotation</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Need pricing for your industrial requirements? Fill out the form with your specifications, and our sourcing experts will get back to you with a competitive quote within 24 hours.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-foreground font-medium">
                    <ShieldCheck className="w-5 h-5 text-primary" /> No obligation quotes
                  </li>
                  <li className="flex items-center gap-3 text-foreground font-medium">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Bulk pricing available
                  </li>
                  <li className="flex items-center gap-3 text-foreground font-medium">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Technical review included
                  </li>
                </ul>
              </div>
              <div>
                <RFQForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
