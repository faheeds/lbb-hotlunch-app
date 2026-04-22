import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { AppNav } from "@/components/app-nav";

const features = [
  { text: "Two campuses",    sub: "Redmond & Bellevue",           icon: "location" },
  { text: "20+ menu items", sub: "Burgers, chicken & more",       icon: "menu"     },
  { text: "Save your kids", sub: "Faster checkout every time",    icon: "child"    },
  { text: "Weekly planner", sub: "One checkout for the week",     icon: "calendar" },
];

const steps = [
  { n: "1", title: "Pick school & date",  body: "Redmond or Bellevue (9 PM cutoff). Only open dates are shown." },
  { n: "2", title: "Build your order",    body: "20+ items — burgers, chicken, salads & sides. Full customization." },
  { n: "3", title: "Pay & confirm",       body: "Secure Stripe checkout. Confirmation email sent right away." },
];

const foodStrip = [
  { src: "/food/Salad.jpg",              alt: "Fresh salad"            },
  { src: "/food/burger-cheesy.webp",     alt: "Smash burger"           },
  { src: "/food/chicken-tenders.jpeg",   alt: "Chicken tenders"        },
  { src: "/food/burger-diner.jpeg",      alt: "Double patty burger"    },
  { src: "/food/chicken-sandwich.jpeg",  alt: "Crispy chicken sandwich"},
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="app-content">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden" style={{ height: 290 }}>
          <Image
            src="/food/hero.jpeg"
            alt="Local Bigger Burger spread"
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            priority
          />
          {/* Dark red gradient overlay */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(170deg, rgba(28,5,5,0.30) 0%, rgba(28,5,5,0.92) 75%)"
          }} />

          <div className="absolute inset-0 flex flex-col justify-end" style={{ padding: "0 20px 24px" }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
              textTransform: "uppercase", color: "#f59e0b",
              marginBottom: 6, fontFamily: "var(--font-oswald)"
            }}>
              ★ Local Bigger Burger ★
            </p>
            <h1 style={{
              fontSize: 38, fontWeight: 700, lineHeight: 1.0,
              color: "white", marginBottom: 10,
              fontFamily: "var(--font-oswald)",
              textTransform: "uppercase", letterSpacing: "0.01em"
            }}>
              Medina Academy<br/>
              <span style={{ color: "#fbbf24" }}>Hot Lunch</span>
            </h1>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginBottom: 20, lineHeight: 1.5 }}>
              Fresh burgers, chicken &amp; more — order for tomorrow or plan the whole week.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/order" style={{
                padding: "12px 22px", borderRadius: 100,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                background: "#c41230", color: "white",
                fontFamily: "var(--font-oswald)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                boxShadow: "0 4px 16px rgba(196,18,48,0.45)"
              }}>
                Order Today
              </Link>
              <Link href="/weekly" style={{
                padding: "12px 20px", borderRadius: 100,
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                background: "rgba(255,255,255,0.10)", color: "white",
                border: "1.5px solid rgba(255,255,255,0.28)",
                backdropFilter: "blur(8px)"
              }}>
                Plan the week
              </Link>
            </div>
          </div>
        </div>

        {/* ── Food strip ──────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 4px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#c41230", marginBottom: 13,
            fontFamily: "var(--font-oswald)"
          }}>
            On the Menu
          </p>
          <div className="food-strip" style={{
            display: "flex", gap: 10, overflowX: "auto",
            paddingBottom: 4, scrollSnapType: "x mandatory"
          }}>
            {foodStrip.map((item) => (
              <div key={item.src} style={{
                flexShrink: 0, width: 90, height: 90,
                borderRadius: 14, overflow: "hidden",
                position: "relative", scrollSnapAlign: "start",
                boxShadow: "0 3px 10px rgba(28,5,5,0.18)"
              }}>
                <Image src={item.src} alt={item.alt} fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature cards ───────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {features.map((f) => (
              <div key={f.text} style={{
                background: "white", borderRadius: 16, padding: "16px 14px",
                boxShadow: "0 1px 4px rgba(28,5,5,0.08)",
                border: "1px solid rgba(196,18,48,0.07)"
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: "#fff1f2", display: "flex",
                  alignItems: "center", justifyContent: "center", marginBottom: 11
                }}>
                  <FeatureIcon name={f.icon} />
                </div>
                <p style={{
                  fontSize: 13, fontWeight: 700, color: "#1c0505",
                  marginBottom: 3, fontFamily: "var(--font-oswald)",
                  textTransform: "uppercase", letterSpacing: "0.03em"
                }}>
                  {f.text}
                </p>
                <p style={{ fontSize: 11, color: "#78716c", lineHeight: 1.4 }}>
                  {f.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 28px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#c41230", marginBottom: 13,
            fontFamily: "var(--font-oswald)"
          }}>
            How it works
          </p>
          <div style={{
            background: "white", borderRadius: 18, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(28,5,5,0.08)",
            border: "1px solid rgba(196,18,48,0.07)"
          }}>
            {steps.map((step, i) => (
              <div key={step.n} style={{
                display: "flex", gap: 14, padding: "16px 18px",
                alignItems: "flex-start",
                borderBottom: i < steps.length - 1 ? "1px solid rgba(28,5,5,0.05)" : "none"
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#c41230", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(196,18,48,0.35)"
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: "white",
                    fontFamily: "var(--font-oswald)"
                  }}>
                    {step.n}
                  </span>
                </div>
                <div>
                  <p style={{
                    fontSize: 14, fontWeight: 700, color: "#1c0505",
                    marginBottom: 3, fontFamily: "var(--font-oswald)",
                    textTransform: "uppercase", letterSpacing: "0.03em"
                  }}>
                    {step.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#78716c", lineHeight: 1.55 }}>
                    {step.body}
                  </p>
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

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    location: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c41230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    menu: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c41230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    child: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c41230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4"/>
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      </svg>
    ),
    calendar: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c41230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  };
  return <>{icons[name]}</>;
}
