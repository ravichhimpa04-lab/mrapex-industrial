import React from 'react';
import { Helmet } from 'react-helmet';

import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RFQForm from '@/components/RFQForm.jsx';

import HeroSection from '@/components/home/HeroSection.jsx';
import ProcurementSection from '@/components/home/ProcurementSection.jsx';
import CapabilitySection from '@/components/home/CapabilitySection.jsx';
import IndustriesSection from '@/components/home/IndustriesSection.jsx';
import BrandsSection from '@/components/home/BrandsSection.jsx';
import PanIndiaSection from '@/components/home/PanIndiaSection.jsx';
import WhyChooseSection from '@/components/home/WhyChooseSection.jsx';
import ExactPartCTA from '@/components/home/ExactPartCTA.jsx';

function HomePage() {
  return (
    <>
      <Helmet>
        <title>
          MR Apex Industrial Components | Industrial Procurement & Sourcing Across India
        </title>
        <meta
          name="description"
          content="MR Apex Industrial Components helps industries source OEM, aftermarket and hard-to-find industrial parts, hydraulic components, Volvo parts, valves, fittings, MSV spares and machinery components across India."
        />
      </Helmet>

      <Header />

      <main>
        <HeroSection />
        <ProcurementSection />
        <CapabilitySection />
        <IndustriesSection />
        <BrandsSection />
        <PanIndiaSection />
        <WhyChooseSection />
        <ExactPartCTA />

        <section id="rfq-form" className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-primary font-semibold mb-2">
                  Request Industrial RFQ
                </p>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
                  Share Your Industrial Parts Requirement
                </h2>

                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Send your part number, product image, drawing, machine make,
                  model, quantity or delivery location. MR Apex will review your
                  requirement and help you source suitable OEM or aftermarket
                  industrial components through its supplier network.
                </p>

                <div className="rounded-3xl bg-muted/50 border p-6">
                  <h3 className="text-xl font-extrabold text-foreground mb-4">
                    You can request quotation for:
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-muted-foreground">
                    <div>✓ Hydraulic Pumps & Valves</div>
                    <div>✓ Volvo & Heavy Equipment Parts</div>
                    <div>✓ Hose Pipes, Fittings & Couplings</div>
                    <div>✓ MSV & Machinery Spares</div>
                    <div>✓ OEM / Aftermarket Components</div>
                    <div>✓ Hard-to-Find Industrial Parts</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-4 shadow-xl">
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