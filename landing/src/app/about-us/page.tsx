"use client";

import React, { useState } from "react";
import { MessageCircle, Menu, X, Leaf, Tractor, Users, MapPin, Search, ArrowRight, ShieldCheck, HeartHandshake, Truck } from "lucide-react";
import Image from "next/image";

export default function AboutUsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      
      {/* Subtle Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Floating Pill Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl flex items-center justify-between px-2 py-2 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-lg shadow-slate-900/5">
        <div className="flex items-center gap-3 pl-4">
          <div className="w-8 h-8 relative bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
            <Image src="/images/logo.png" alt="DG-LETS" fill className="object-cover scale-110" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-900 text-lg">DG-LETS</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="/#home" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Home</a>
          <a href="/#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</a>
          <a href="/#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
          <a href="/about-us" className="text-sm font-semibold text-emerald-600 transition-colors">About Us</a>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2">
          <a href="/#register" className="bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Join Early Access
          </a>
        </div>

        <button className="md:hidden pr-4 text-slate-700" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 md:hidden">
          <a href="/#home" className="text-slate-600 font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
          <a href="/#features" className="text-slate-600 font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="/about-us" className="text-slate-900 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
          <a href="/#register" className="bg-slate-900 text-white px-4 py-3 rounded-2xl font-semibold mt-4 w-full text-center">
            Join Early Access
          </a>
        </div>
      )}

      {/* Founder Hero */}
      <section className="relative z-10 pt-40 pb-20 bg-emerald-950 text-white overflow-hidden rounded-b-[3rem] shadow-2xl mb-24">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8">
            <a href="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm mb-6 transition-colors">
              &larr; Back to Home
            </a>
            <span className="block text-emerald-500 font-bold tracking-widest uppercase text-xs mb-4">A Note from the Founder & CEO</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              We Are Not Just Building an App. We Are Building a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 italic pr-2">New Way Agriculture</span> Connects With People.
            </h1>
            <p className="text-lg text-emerald-100/70 font-medium max-w-2xl">
              A message on the vision, purpose and future of DG-LETS Agri Market — and why we believe technology can transform agricultural commerce in Nigeria and beyond.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/10 shadow-[0_0_0_8px_rgba(16,185,129,0.1)] mb-6">
              <Image src="/images/founder.jpg" alt="Emwenbun Daniel Osadolor" width={192} height={192} className="object-cover w-full h-full object-top" />
            </div>
            <div className="text-center">
              <strong className="block text-lg font-bold text-white">Emwenbun Daniel Osadolor</strong>
              <span className="block text-sm text-emerald-300/80 font-medium">Founder & CEO</span>
              <span className="block text-xs text-emerald-100/50 mt-1">DG-LETS Agri & Tech Nig Ltd</span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 relative z-10 pb-32">
        <p className="text-xl italic text-slate-700 leading-relaxed font-serif border-l-4 border-emerald-500 pl-6 mb-16">
          Agriculture has always been one of the foundations of our society. Farmers work tirelessly to produce the food that feeds families, businesses, and communities. Yet despite the importance of agriculture, there is still a major gap between the people who produce food and the people who need it.
        </p>

        <div className="space-y-6 text-lg text-slate-600 mb-16">
          <p>
            Farmers often struggle to reach reliable markets and get fair visibility for their products. Buyers and households can struggle to find genuine, fresh, trustworthy farm produce at the right price. Businesses may find it difficult to connect with reliable suppliers, while logistics remains one of the biggest challenges in moving agricultural products efficiently from one location to another.
          </p>
          <p className="font-semibold text-slate-900">
            At DG-LETS AGRI MARKET, we believe technology can help bridge these gaps.
          </p>
          <p>
            That is why we are building something bigger than an ordinary online marketplace. We are building a digital agricultural ecosystem designed to bring together farmers, buyers, households, businesses, produce suppliers, and delivery and haulage partners within one growing platform.
          </p>
        </div>

        {/* Pull Quote */}
        <div className="relative bg-emerald-900 rounded-3xl p-10 md:p-14 mb-16 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px]" />
          <MessageCircle size={120} className="absolute -top-6 -left-6 text-emerald-800/50 -rotate-12" />
          <p className="relative z-10 text-xl md:text-2xl italic font-serif text-emerald-50 leading-relaxed">
            "To make access to agricultural products easier, make markets more accessible for farmers, improve trust in agricultural transactions, and create a smarter connection between food, technology, logistics, and people."
          </p>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Leaf size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Our Vision: From Farm to Phone</h2>
          </div>
          <p className="text-lg text-slate-600 mb-6">
            Imagine being able to open your phone, explore available agricultural products, discover farmers and verified produce suppliers, compare available options, and conveniently place an order from wherever you are.
          </p>
          <ul className="space-y-4 text-slate-600 mb-8">
            <li className="flex gap-3"><ArrowRight className="text-emerald-500 flex-shrink-0 mt-1" size={20}/> Imagine a busy parent being able to order fresh food without spending hours moving from market to market.</li>
            <li className="flex gap-3"><ArrowRight className="text-emerald-500 flex-shrink-0 mt-1" size={20}/> Imagine a restaurant or business being able to connect with agricultural suppliers more efficiently.</li>
            <li className="flex gap-3"><ArrowRight className="text-emerald-500 flex-shrink-0 mt-1" size={20}/> Imagine farmers having greater visibility beyond their immediate communities.</li>
          </ul>
          <p className="text-lg font-bold text-emerald-700 bg-emerald-50 inline-block px-4 py-2 rounded-xl">From Farm to Phone. From Farm to Doorstep.</p>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">What We Are Building</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Tractor className="text-emerald-600 mb-4" size={28} />
              <h3 className="font-bold text-slate-900 mb-2">Farmers & Produce Sellers</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Farmers and agricultural suppliers will have opportunities to showcase their available products and connect with potential customers.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Users className="text-emerald-600 mb-4" size={28} />
              <h3 className="font-bold text-slate-900 mb-2">Buyers & Households</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Individuals and families will be able to explore agricultural products and conveniently order what they need.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Truck className="text-emerald-600 mb-4" size={28} />
              <h3 className="font-bold text-slate-900 mb-2">Delivery & Haulage Partners</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Bikers, delivery providers, and haulage companies will have opportunities to participate in moving agricultural products.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Search className="text-emerald-600 mb-4" size={28} />
              <h3 className="font-bold text-slate-900 mb-2">Smart Technology</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Intelligent features that help users discover products, make better choices, and create a smarter marketplace experience.</p>
            </div>
          </div>
        </div>
        
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <HeartHandshake size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Our Exclusive Approach</h2>
          </div>
          <p className="text-lg text-slate-600 mb-6">
            We are not rushing to build just another marketplace. We are building with a long-term vision. Our approach is to grow strategically, listen to real users, understand the challenges faced by farmers and buyers, and continuously improve the platform based on real-world needs.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
            <p className="text-emerald-800 font-semibold mb-4">
              "The people joining us early will not simply be watching from the outside. They will be among the first communities helping shape the future of what DG-LETS AGRI MARKET becomes."
            </p>
          </div>
        </div>

        {/* Signature */}
        <div className="flex flex-col items-center mt-24 text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-200 mb-4">
            <Image src="/images/founder.jpg" alt="Emwenbun Daniel Osadolor" width={80} height={80} className="object-cover w-full h-full object-top" />
          </div>
          <strong className="text-lg text-slate-900">Emwenbun Daniel Osadolor</strong>
          <span className="text-sm text-slate-500 mb-2">Founder & CEO, DG-LETS Agri & Tech Nig Ltd</span>
          <p className="text-xs font-bold tracking-widest text-emerald-600 mt-4 border-t border-slate-200 pt-4 px-8">FROM FARM TO PHONE. FROM FARM TO DOORSTEP.</p>
        </div>
      </article>
      
      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm relative z-10 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative bg-slate-900 rounded-full overflow-hidden shadow-inner">
              <Image src="/images/logo.png" alt="DG-LETS" fill className="object-cover scale-110" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900">DG-LETS</span>
          </div>
          <p className="text-sm font-medium text-slate-500 text-center md:text-left">
            © 2026 DG-LETS Agri Market Place. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
