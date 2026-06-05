
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RFQForm from '@/components/RFQForm.jsx';

function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact Us - MR Apex Industrial Components</title>
        <meta name="description" content="Contact MR Apex Industrial Components for industrial components, MRO supplies, and custom engineering parts. Request a quote today." />
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
              Contact Us
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed"
            >
              Get in touch with our sourcing experts for competitive quotes, product inquiries, or technical support.
            </motion.p>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              
              {/* Contact Info Column */}
              <div className="lg:col-span-4 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Company Details</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">MR Apex Industrial Components</h3>
                        <p className="text-muted-foreground mt-1">Jaipur, Rajasthan<br />India</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">Phone</h3>
                        <p className="text-muted-foreground mt-1">9602338804</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">Email</h3>
                        <p className="text-muted-foreground mt-1">ravichhimpa04@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-accent text-accent-foreground rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-2">Instant Support</h3>
                  <p className="opacity-90 mb-6 text-sm">Need immediate assistance? Reach out to us directly on WhatsApp.</p>
                  <a 
                    href="https://wa.me/9602338804" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              {/* Form Column */}
              <div className="lg:col-span-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2 text-foreground">Request a Quotation</h2>
                  <p className="text-muted-foreground">Fill out the form below and we'll get back to you within 24 hours.</p>
                </div>
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

export default ContactPage;
