import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

function HeroSection() {
  const trustBadges = [
    { icon: ShieldCheck, text: 'Verified Supplier Network' },
    { icon: Truck, text: 'Pan India Supply Support' },
    { icon: BadgeCheck, text: 'OEM & Aftermarket Sourcing' },
    { icon: MapPinned, text: 'RFQ Based Procurement' },
  ];

  const sourcingCapabilities = [
  'OEM Industrial Parts',
  'Aftermarket Components',
  'Hard-to-Find Parts',
  'Hydraulic Systems',
  'Volvo & Heavy Equipment',
  'Industrial MRO Supplies',
  'Pan India Supply',
  'RFQ Based Procurement',
];

  return (
    <section className="relative overflow-hidden bg-[#020817] text-white">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/mr-apex-hero-bg.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.58)',
          transform: 'scale(1.01)',
        }}
      />

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(135deg, rgba(2,8,23,0.88) 0%, rgba(2,8,23,0.55) 52%, rgba(2,8,23,0.78) 100%)',
        }}
      />

      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className="absolute left-0 top-16 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute right-10 top-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute left-10 bottom-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 container-custom pt-28 pb-20 lg:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-sm text-white/90 mb-6 backdrop-blur">
              <Sparkles className="w-4 h-4 text-blue-300" />
              INDUSTRIAL PROCUREMENT & SOURCING
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight mb-6 uppercase">
              Industrial Parts
              <br />
              Procurement{' '}
              <span className="text-blue-500 drop-shadow-[0_0_18px_rgba(37,99,235,0.6)]">
                Across India
              </span>
            </h1>

            <p className="text-base md:text-xl text-white/82 leading-relaxed max-w-2xl mb-8">
              MR Apex Industrial Components helps industries source OEM,
              aftermarket and hard-to-find industrial components through a
              trusted supplier network across India.
            </p>

            <div className="rounded-2xl border border-blue-400/20 bg-slate-950/55 backdrop-blur-xl p-4 max-w-2xl shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="h-14 px-8 w-full sm:w-auto">
                  <a href="#rfq-form">
                    Submit Industrial Requirement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 w-full sm:w-auto border-blue-400/30 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link to="/products">Browse Product Catalogue</Link>
                </Button>
              </div>

            </div>
          </motion.div>

          <motion.div
  initial={{ opacity: 0, scale: 0.96 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.65, delay: 0.1 }}
  className="relative"
>
  <div className="absolute -inset-8 bg-blue-500/20 blur-3xl rounded-full" />

  <div className="relative rounded-3xl border border-blue-400/25 bg-slate-950/60 p-7 shadow-2xl backdrop-blur-xl">

    <p className="text-blue-300 font-semibold mb-6">
      Industrial Sourcing Capabilities
    </p>

    <div className="grid grid-cols-2 gap-3">
      {sourcingCapabilities.map((item) => (
        <div
          key={item}
          className="flex items-center gap-2 rounded-xl border border-blue-400/15 bg-white/5 px-3 py-3"
        >
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-sm font-medium text-white/90">
            {item}
          </span>
        </div>
      ))}
    </div>

    <div className="mt-7 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">

      <p className="text-lg font-bold text-white mb-2">
        Need a Part Not Listed?
      </p>

      <p className="text-sm leading-relaxed text-white/70">
        Share your part number, machine model, drawing or product image.
        Our sourcing team will help identify suitable OEM or compatible
        aftermarket industrial components.
      </p>

    </div>

  </div>
</motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="mt-8 rounded-2xl border border-blue-400/18 bg-slate-950/55 backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-blue-400/15">
            {trustBadges.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.text} className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.text}</h3>
                    <p className="text-sm text-white/60">
                      Industrial buyer support
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;