
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Map, Clock, ShieldCheck, Settings, Truck, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

function AboutUsPage() {
  const benefits = [
    { icon: Zap, title: 'Competitive Pricing', desc: 'We leverage our network to provide the best value for industrial-grade components without compromising on quality.' },
    { icon: Map, title: 'Trusted Supplier Network', desc: 'All our products are sourced from verified, reliable manufacturers with proven track records.' },
    { icon: Clock, title: 'Fast Response Time', desc: 'We understand industrial urgency. Expect quick quotes and rapid technical support from our team.' },
    { icon: ShieldCheck, title: 'Reliable Quality', desc: 'Strict quality control standards ensure you receive components that meet your exact specifications.' },
    { icon: Settings, title: 'Technical Support', desc: 'Our experienced team provides expert guidance for component selection and custom engineering needs.' },
    { icon: Truck, title: 'Nationwide Service', desc: 'Efficient logistics network ensuring timely delivery across all major industrial hubs in India.' },
  ];

  return (
    <>
      <Helmet>
        <title>About Us - MR Apex Industrial Components</title>
        <meta name="description" content="MR Apex Industrial Components is an industrial sourcing and supply company helping businesses procure industrial components through a reliable supplier network." />
      </Helmet>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 flex items-center bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1685302910286-59273f5aef4b)' }}>
          <div className="absolute inset-0 bg-primary/90 mix-blend-multiply" />
          <div className="relative z-10 container-custom text-white">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                About MR Apex Industrial Components
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                MR Apex Industrial Components is an industrial sourcing and supply company helping businesses procure industrial components, MRO supplies, electrical products and custom engineering items through a reliable supplier network. We focus on quality, competitive pricing and fast response support.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Choose MR Apex</h2>
              <p className="text-muted-foreground text-lg">Our commitment to excellence sets us apart in the industrial supply chain.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-8 shadow-sm border"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
                <p className="text-lg opacity-90 mb-8">
                  Ready to streamline your industrial procurement? Contact our team in Jaipur to discuss your requirements.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Location</p>
                      <p className="opacity-90">Jaipur, Rajasthan, India</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Email</p>
                      <p className="opacity-90">admin@mrapexindustrial.in</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 w-full lg:w-auto">
                <Button size="lg" variant="secondary" asChild className="bg-white text-primary hover:bg-gray-100 h-14 px-8 text-lg">
                  <Link to="/contact">Request a Quote</Link>
                </Button>
                <Button size="lg" asChild className="bg-[#25D366] text-white hover:bg-[#20bd5a] h-14 px-8 text-lg border-none">
                  <a href="https://wa.me/919602338804?text=Hello%20MR%20Apex%20Industrial%20Components" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AboutUsPage;
