import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { AppNav } from "@/components/app-nav";

const quickPoints = [
  { text: "Two campuses: Redmond & Bellevue", icon: "📍" },
  { text: "20+ menu items across 4 categories", icon: "🍔" },
  { text: "Save children for faster checkout", icon: "👧" },
  { text: "Weekly planner — one checkout", icon: "📅" },
];

const steps = [
  { n: "1", title: "Pick school & date", body: "Redmond (5 PM cutoff) or Bellevue (4:30 PM). Only open delivery dates are shown." },
  { n: "2", title: "Build your order", body: "Choose from 20+ items. Add required choices, add-ons, and removals. Cart supports multiple items." },
  { n: "3", title: "Pay & confirm", body: "Secure Stripe checkout. Confirmation email sent immediately." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="app-content">
        <div className="px-4 py-4 space-y-3 pb-6">

          {/* Hero */}
          <div className="rounded-[18px] bg-ink p-5 text-white">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-green-300 mb-1.5">Local Bigger Burger</p>
            <h1 className="text-[20px] font-semibold leading-snug mb-2">Medina Academy<br/>Hot Lunch Preorders</h1>
            <p className="text-[12px] text-slate-300 leading-relaxed mb-4">
              Fresh burgers, sandwiches, salads &amp; more. Order for tomorrow or plan the whole week.
            </p>
            <div className="flex gap-2">
              <Link href="/order" className="px-4 py-2.5 rounded-full bg-white text-ink text-[12px] font-semibold no-underline">
                Start ordering
              </Link>
              <Link href="/account" className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-[12px] font-semibold no-underline">
                My account
              </Link>
            </div>
          </div>

          {/* Quick points */}
          <div className="grid grid-cols-2 gap-2">
            {quickPoints.map((qp) => (
              <div key={qp.text} className="rounded-[14px] bg-brand-50 border border-brand-100 p-3">
                <span className="text-base">{qp.icon}</span>
                <p className="text-[11px] font-medium text-brand-900 mt-1 leading-snug">{qp.text}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="rounded-[18px] border border-slate-100 bg-white divide-y divide-slate-100 overflow-hidden">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-3 p-4 items-start">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[12px] font-semibold text-brand-900 flex-shrink-0 mt-0.5">
                  {step.n}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink mb-1">{step.title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
      <AppNav />
    </>
  );
}
