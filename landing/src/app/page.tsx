"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Menu, X, ArrowRight, Store, Tractor, Truck, ShoppingCart,
  Globe, Handshake, Wrench, Zap, ShieldCheck, CheckSquare, CreditCard,
  Headphones, Check, Lock,
} from "lucide-react";
import Image from "next/image";

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyqd46JMtB_OE0HTqAmpNiQECswBwVuBRz4rFlwhOd9Bhqb4zPsNGzRwCIou2kPx1bN/exec";
const WA_NUMBER = "2348070566642";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe",
  "Zamfara","FCT - Abuja",
];

type Role = "farmer" | "buyer" | "supplier" | "logistics";

const roleConfig: Record<Role, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  farmer:    { label: "Farmer",            icon: Tractor,      color: "text-emerald-500", bg: "bg-emerald-50" },
  buyer:     { label: "Buyer",             icon: ShoppingCart, color: "text-blue-500",    bg: "bg-blue-50" },
  supplier:  { label: "Supplier",          icon: Store,        color: "text-amber-500",   bg: "bg-amber-50" },
  logistics: { label: "Logistics Partner", icon: Truck,        color: "text-purple-500",  bg: "bg-purple-50" },
};

const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400";
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function StateSelect({ name }: { name: string }) {
  return (
    <select name={name} required defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
      <option value="" disabled>Select your state</option>
      {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
    </select>
  );
}

function FarmerForm() {
  return (
    <>
      <Field label="Full Name"><input name="name" type="text" required placeholder="e.g. Aminu Bello" className={inputCls} /></Field>
      <Field label="Phone Number"><input name="phone" type="tel" required placeholder="e.g. 08012345678" className={inputCls} /></Field>
      <Field label="Email Address (optional)"><input name="email" type="email" placeholder="your@email.com" className={inputCls} /></Field>
      <Field label="State"><StateSelect name="state" /></Field>
      <Field label="LGA (Local Govt. Area)"><input name="lga" type="text" placeholder="e.g. Ikorodu" className={inputCls} /></Field>
      <Field label="Farm Location / Nearest Town"><input name="farmLocation" type="text" placeholder="e.g. Ikorodu outskirts" className={inputCls} /></Field>
      <Field label="Products You Grow / Sell"><input name="products" required type="text" placeholder="e.g. Tomatoes, Yam, Maize" className={inputCls} /></Field>
      <Field label="Estimated Weekly Capacity">
        <select name="capacity" defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
          <option value="" disabled>Select range</option>
          <option>Below 50kg</option>
          <option>50kg - 200kg</option>
          <option>200kg - 1 tonne</option>
          <option>Above 1 tonne</option>
        </select>
      </Field>
    </>
  );
}

function BuyerForm() {
  return (
    <>
      <Field label="Full Name"><input name="name" type="text" required placeholder="e.g. Fatima Bello" className={inputCls} /></Field>
      <Field label="Phone Number"><input name="phone" type="tel" required placeholder="e.g. 08012345678" className={inputCls} /></Field>
      <Field label="Email Address (optional)"><input name="email" type="email" placeholder="your@email.com" className={inputCls} /></Field>
      <Field label="State"><StateSelect name="state" /></Field>
      <Field label="LGA (Local Govt. Area)"><input name="lga" type="text" placeholder="e.g. Surulere" className={inputCls} /></Field>
      <Field label="Products You Want to Buy"><input name="products" required type="text" placeholder="e.g. Rice, Vegetables, Fruits" className={inputCls} /></Field>
      <Field label="How Often Do You Buy?">
        <select name="frequency" defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
          <option value="" disabled>Select frequency</option>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Occasionally</option>
        </select>
      </Field>
      <Field label="Buyer Type">
        <select name="buyerType" defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
          <option value="" disabled>Select type</option>
          <option>Individual / Household</option>
          <option>Restaurant / Food Business</option>
          <option>Retailer</option>
          <option>Exporter / Bulk Buyer</option>
          <option>Other</option>
        </select>
      </Field>
    </>
  );
}

function SupplierForm() {
  return (
    <>
      <Field label="Full Name / Business Name"><input name="name" type="text" required placeholder="e.g. Green Harvest Ltd" className={inputCls} /></Field>
      <Field label="Phone Number"><input name="phone" type="tel" required placeholder="e.g. 08012345678" className={inputCls} /></Field>
      <Field label="Email Address (optional)"><input name="email" type="email" placeholder="your@email.com" className={inputCls} /></Field>
      <Field label="State"><StateSelect name="state" /></Field>
      <Field label="Products / Inputs You Supply"><input name="products" required type="text" placeholder="e.g. Seedlings, Fertilizers, Agro-chemicals" className={inputCls} /></Field>
      <Field label="Supplier Type">
        <select name="supplierType" defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
          <option value="" disabled>Select type</option>
          <option>Agro-input dealer</option>
          <option>Produce aggregator</option>
          <option>Equipment supplier</option>
          <option>Packaging supplier</option>
          <option>Other</option>
        </select>
      </Field>
    </>
  );
}

function LogisticsForm() {
  return (
    <>
      <Field label="Full Name / Business Name"><input name="name" type="text" required placeholder="e.g. Swift Movers" className={inputCls} /></Field>
      <Field label="Phone Number"><input name="phone" type="tel" required placeholder="e.g. 08012345678" className={inputCls} /></Field>
      <Field label="Email Address (optional)"><input name="email" type="email" placeholder="your@email.com" className={inputCls} /></Field>
      <Field label="State Based In"><StateSelect name="state" /></Field>
      <Field label="Coverage Area / Routes"><input name="coverage" type="text" placeholder="e.g. Lagos to Ibadan, Kano North" className={inputCls} /></Field>
      <Field label="Vehicle Type">
        <select name="vehicleType" defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
          <option value="" disabled>Select vehicle type</option>
          <option>Motorcycle / Keke</option>
          <option>Pick-up truck</option>
          <option>Medium lorry</option>
          <option>Large haulage truck</option>
          <option>Refrigerated vehicle</option>
          <option>Other</option>
        </select>
      </Field>
      <Field label="Carrying Capacity">
        <select name="capacity" defaultValue="" className={inputCls + " appearance-none cursor-pointer"}>
          <option value="" disabled>Select capacity</option>
          <option>Below 500kg</option>
          <option>500kg - 2 tonnes</option>
          <option>2 - 10 tonnes</option>
          <option>Above 10 tonnes</option>
        </select>
      </Field>
    </>
  );
}

function RegistrationModal({ initialRole, onClose }: { initialRole: Role; onClose: () => void }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      await fetch(SHEET_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role, source: `early-access-${role}`, userAgent: navigator.userAgent }),
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Icon = roleConfig[role].icon;
  const waMsg = (r: Role) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hello DG-LETS, I just registered as a ${roleConfig[r].label}!`)}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${roleConfig[role].bg} rounded-xl flex items-center justify-center`}>
              <Icon size={20} className={roleConfig[role].color} />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">Join as {roleConfig[role].label}</p>
              <p className="text-xs text-slate-400 mt-0.5">Secure your early access spot</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        {!success ? (
          <>
            {/* Role Tabs */}
            <div className="px-6 pt-5 pb-3 grid grid-cols-4 gap-2">
              {(Object.keys(roleConfig) as Role[]).map((r) => {
                const Ic = roleConfig[r].icon;
                return (
                  <button key={r} type="button"
                    onClick={() => { setRole(r); formRef.current?.reset(); }}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl text-[11px] font-bold transition-all border ${
                      role === r
                        ? `${roleConfig[r].bg} ${roleConfig[r].color} border-current/20 shadow-sm`
                        : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <Ic size={18} />
                    <span className="capitalize leading-none">{r}</span>
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-3.5">
              {role === "farmer"    && <FarmerForm />}
              {role === "buyer"     && <BuyerForm />}
              {role === "supplier"  && <SupplierForm />}
              {role === "logistics" && <LogisticsForm />}
              <button type="submit" disabled={isSubmitting}
                className="w-full mt-2 bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-slate-900/10"
              >
                {isSubmitting ? "Submitting..." : `Join as ${roleConfig[role].label}`}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Lock size={11} /> We respect your privacy. No spam, ever.
              </p>
            </form>
          </>
        ) : (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
              <Check size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">You are on the waitlist!</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
              {role === "farmer"    && "We will notify you when DG-LETS launches in your state and you can start connecting with buyers."}
              {role === "buyer"     && "We will notify you when DG-LETS launches near you so you can access fresh farm produce easily."}
              {role === "supplier"  && "We will reach out when the platform is ready so you can list your products and grow your business."}
              {role === "logistics" && "We will notify you about partnership opportunities as soon as the platform launches."}
            </p>
            <a href={waMsg(role)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25d366] text-white rounded-2xl font-bold text-sm hover:bg-[#22c55e] transition-all hover:scale-[1.02] shadow-lg shadow-green-500/20"
            >
              <MessageCircle size={18} /> Say Hi on WhatsApp
            </a>
            <button onClick={onClose} className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [modal, setModal] = useState<{ open: boolean; role: Role }>({ open: false, role: "farmer" });

  const openModal = (role: Role = "farmer") => {
    setModal({ open: true, role });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">

      {modal.open && (
        <RegistrationModal initialRole={modal.role} onClose={() => setModal(m => ({ ...m, open: false }))} />
      )}

      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <div className="absolute -top-32 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl flex items-center justify-between px-2 py-2 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-lg shadow-slate-900/5">
        <div className="flex items-center gap-3 pl-4">
          <div className="w-8 h-8 relative bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
            <Image src="/images/logo.png" alt="DG-LETS" fill className="object-cover scale-110" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-900 text-lg">DG-LETS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="/#home" className="text-sm font-semibold text-emerald-600">Home</a>
          <a href="/#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Features</a>
          <a href="/#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
          <a href="/about-us" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">About Us</a>
        </div>
        <div className="hidden md:flex items-center gap-2 pr-2">
          <button onClick={() => openModal("farmer")} className="bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Join Early Access
          </button>
        </div>
        <button className="md:hidden pr-4 text-slate-700" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 md:hidden">
          <a href="/#home" className="text-slate-900 font-bold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
          <a href="/#features" className="text-slate-600 font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="/#how-it-works" className="text-slate-600 font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a>
          <a href="/about-us" className="text-slate-600 font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
          <button onClick={() => openModal("farmer")} className="bg-slate-900 text-white px-4 py-3 rounded-2xl font-semibold mt-4 w-full">
            Join Early Access
          </button>
        </div>
      )}

      {/* Hero */}
      <section id="home" className="relative z-10 pt-40 md:pt-48 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-8 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/80 border border-slate-200/60 text-slate-600 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Platform Coming Soon
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
          Connect, Trade &amp; Grow <br className="hidden md:block" />
          <span className="italic text-emerald-600 font-extrabold pr-2">Inside</span> the Agri Market.
        </h1>
        <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mb-12">
          DG-LETS is the premier digital marketplace connecting farmers, buyers, suppliers, and logistics providers on one smart platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button onClick={() => openModal("farmer")} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-900/10 group">
            Get Early Access
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a href={`https://wa.me/${WA_NUMBER}?text=Hello%20DG-LETS`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-semibold rounded-2xl hover:text-slate-900 border border-slate-200/80 transition-all duration-200 hover:shadow-sm">
            <MessageCircle size={18} className="text-[#25d366]" />
            Chat on WhatsApp
          </a>
        </div>
      </section>

      {/* Banner Image */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto pb-24">
        <div className="relative w-full aspect-video md:aspect-[2.5/1] rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-900/5 bg-slate-100 overflow-hidden">
          <Image src="/images/banner.png" alt="Farmers using DG-LETS App" fill className="object-cover" priority />
        </div>
      </section>

      {/* App Status */}
      <section className="relative z-10 px-6 max-w-7xl mx-auto pb-24">
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-900/5 overflow-hidden">
          <div className="bg-[#1e462d] px-8 py-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />
            <p className="text-emerald-50 font-medium text-sm md:text-base relative z-10">
              While the app is on the way, our platform is already building strong connections between farmers, buyers, suppliers and service providers.
            </p>
          </div>
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-4 sm:p-8">
            {[
              { icon: Handshake,   bg: "bg-amber-50",   color: "text-amber-500",   title: "Farmers to Buyers", desc: "Connecting quality produce to serious buyers.",          badge: "On the way",   badgeCls: "bg-amber-100/50 text-amber-700" },
              { icon: Wrench,      bg: "bg-sky-50",     color: "text-sky-500",     title: "MVP Development",   desc: "Our Minimum Viable Product is in active development.", badge: "In Progress",  badgeCls: "bg-sky-100/50 text-sky-700" },
              { icon: Zap,         bg: "bg-emerald-50", color: "text-emerald-500", title: "Platform Features", desc: "Smart Map, AI matching, payments and delivery.",        badge: "Coming Soon",  badgeCls: "bg-emerald-100/50 text-emerald-700" },
              { icon: ShieldCheck, bg: "bg-rose-50",    color: "text-rose-500",    title: "Trust & Security",  desc: "Verified users and secure transactions.",              badge: "Our Priority", badgeCls: "bg-rose-100/50 text-rose-700" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 group">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={item.color} size={24} />
                </div>
                <h4 className="font-extrabold text-slate-900 mb-2 text-xs sm:text-sm uppercase tracking-wide">{item.title}</h4>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{item.desc}</p>
                <span className={`${item.badgeCls} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-auto`}>{item.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 max-w-7xl mx-auto pb-24 sm:pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">Why Choose DG-LETS?</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {[
            { title: "Wide Network",    desc: "Connect with thousands of buyers, sellers and service providers.", icon: Globe,       color: "text-blue-500",   bg: "bg-blue-50" },
            { title: "Quality Assured", desc: "Access quality agricultural products and trusted vendors.",        icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
            { title: "Secure Payments", desc: "Enjoy safe and secure transactions on every deal.",                icon: CreditCard,  color: "text-sky-500",    bg: "bg-sky-50" },
            { title: "Fast Delivery",   desc: "Reliable delivery service from farm to your doorstep.",            icon: Truck,       color: "text-amber-500",  bg: "bg-amber-50" },
            { title: "24/7 Support",    desc: "Our support team is always ready to assist you.",                  icon: Headphones,  color: "text-purple-500", bg: "bg-purple-50" },
          ].map((feat, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 md:p-8 flex flex-col items-center text-center border border-slate-100 shadow-xl shadow-slate-900/5 transition-transform duration-300 hover:-translate-y-2 group">
              <div className={`w-14 h-14 ${feat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feat.icon size={28} className={feat.color} />
              </div>
              <h3 className="font-extrabold text-slate-900 mb-3 text-sm sm:text-base uppercase tracking-wide">{feat.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 max-w-6xl mx-auto py-24 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">How DG-LETS Works</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">A seamless ecosystem for agricultural trade, connecting you from farm to phone.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 -z-10" />
          {[
            { n: "1", title: "Register your profile", desc: "Join as a farmer, buyer, supplier, or logistics partner. Set up your preferences and location to get tailored matches." },
            { n: "2", title: "Connect & Match",       desc: "Our platform connects farmers with serious buyers, and integrates trusted logistics to handle delivery." },
            { n: "3", title: "Trade Securely",        desc: "Close deals with confidence. Quality is assured, and payments are protected every step of the way." },
          ].map(step => (
            <div key={step.n} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-900/5 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <div className="w-14 h-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-md shadow-slate-900/10">{step.n}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for Everyone */}
      <section id="categories" className="relative z-10 px-6 max-w-7xl mx-auto py-24 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">Built for Everyone in Agriculture</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {(["farmer", "buyer", "supplier", "logistics"] as Role[]).map((r) => {
            const Ic = roleConfig[r].icon;
            const descs: Record<Role, string> = {
              farmer: "Sell your produce and reach more buyers.",
              buyer: "Find quality products at the best prices.",
              supplier: "List your products and grow your business.",
              logistics: "Offer your services and get more clients.",
            };
            return (
              <button key={r} onClick={() => openModal(r)}
                className="bg-[#2a5c3d] text-white rounded-[2rem] p-6 flex flex-col h-64 md:h-72 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/30 group shadow-xl shadow-slate-900/10 text-left"
              >
                <div className="flex-1 flex items-center justify-center">
                  <Ic size={56} strokeWidth={1.5} className="text-emerald-300 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
                </div>
                <div className="mt-auto">
                  <h3 className="font-extrabold text-xl mb-1 capitalize">{r}</h3>
                  <p className="text-[13px] text-emerald-100/80 font-medium leading-relaxed">{descs[r]}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-emerald-300 font-bold">Register Now <ArrowRight size={12} /></span>
                </div>
              </button>
            );
          })}
          <div className="bg-[#2a5c3d] text-white rounded-[2rem] p-6 flex flex-col h-64 md:h-72 shadow-xl shadow-slate-900/10">
            <div className="flex-1 flex items-center justify-center">
              <Globe size={56} strokeWidth={1.5} className="text-emerald-300" />
            </div>
            <div className="mt-auto">
              <h3 className="font-extrabold text-xl mb-1">Everyone</h3>
              <p className="text-[13px] text-emerald-100/80 font-medium leading-relaxed">One app. Endless opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Register CTA */}
      <section id="register" className="relative z-10 px-6 max-w-5xl mx-auto mb-32">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white p-10 md:p-16 border border-slate-800 shadow-2xl text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">Secure your spot on the platform.</h2>
            <p className="text-slate-400 font-medium mb-10 max-w-lg mx-auto">Join the waitlist today. Select your category to unlock tailored features when we launch.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {(Object.keys(roleConfig) as Role[]).map((r) => {
                const Ic = roleConfig[r].icon;
                return (
                  <button key={r} onClick={() => openModal(r)}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-2xl text-white font-semibold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <Ic size={18} className="text-emerald-400" />
                    <span>Join as {roleConfig[r].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
            2026 DG-LETS Agri Market Place. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
          <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Check size={14} className="text-emerald-400" />
          </div>
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
