import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { AppNav } from "@/components/app-nav";

const quickPoints = [
  { text: "Two campuses: Redmond & Bellevue", icon: "location" },
  { text: "20+ menu items across 4 categories", icon: "menu" },
  { text: "Save children for faster checkout", icon: "child" },
  { text: "Weekly planner — one checkout", icon: "calendar" },
];

const steps = [
  { n: "1", title: "Pick school & date", body: "Redmond (5 PM cutoff) or Bellevue (4:30 PM). Only open delivery dates are shown." },
  { n: "2", title: "Build your order", body: "Choose from 20+ items. Add required choices, add-ons, and removals. Cart supports multiple items." },
  { n: "3", title: "Pay & confirm", body: "Secure Stripe checkout. Confirmation email sent immediately." },
];

const iconColors: Record<string, { bg: string; color: string }> = {
  location: { bg: "#fff0e6", color: "#e8640c" },
  menu:     { bg: "#e8f4ff", color: "#2563eb" },
  child:    { bg: "#f0fdf4", color: "#16a34a" },
  calendar: { bg: "#fdf4ff", color: "#9333ea" },
};

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    location: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    menu: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    child: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4"/>
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      </svg>
    ),
    calendar: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  };
  const { bg, color } = iconColors[name];
  return (
    <span style={{
      width: 34, height: 34, borderRadius: 10,
      background: bg, color,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0
    }}>
      {icons[name]}
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="app-content">
        <div className="px-4 py-4 space-y-3 pb-6">

          {/* Hero */}
          <div className="rounded-[20px] bg-ink p-5 text-white" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "#f97316" }}>Local Bigger Burger</p>
            <h1 className="text-[22px] font-semibold leading-snug mb-2 tracking-tight text-white">
              Medina Academy<br/>Hot Lunch Preorders
            </h1>
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
              Fresh burgers, sandwiches, salads &amp; more. Order for tomorrow or plan the whole week.
            </p>
            <div className="flex gap-2">
              <Link href="/order"
                className="px-4 py-2.5 rounded-full text-[12px] font-semibold no-underline text-ink"
                style={{ background: "#f97316", color: "white" }}>
                Start ordering
              </Link>
              <Link href="/account"
                className="px-4 py-2.5 rounded-full text-[12px] font-semibold no-underline"
                style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}>
                My account
              </Link>
            </div>
          </div>

          {/* Quick points */}
          <div className="grid grid-cols-2 gap-2">
            {quickPoints.map((qp) => (
              <div key={qp.text} className="rounded-[14px] bg-white border border-slate-100 p-3.5 shadow-sm flex gap-3 items-start">
                <Icon name={qp.icon} />
                <p className="text-[11px] font-medium text-slate-600 leading-snug mt-0.5">{qp.text}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="rounded-[18px] border border-slate-100 bg-white overflow-hidden">
            {steps.map((step, i) => (
              <div key={step.n} className={`flex gap-3 p-4 items-start ${i < steps.length - 1 ? "border-b border-slate-50" : ""}`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 mt-0.5"
                  style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>
                  {step.n}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink mb-0.5">{step.title}</p>
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
