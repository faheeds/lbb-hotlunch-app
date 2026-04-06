import Link from "next/link";
import { signOut } from "@/lib/auth";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/delivery-dates", label: "Dates" },
];

export function AdminNav() {
  return (
    <div className="mb-5 rounded-[18px] border border-slate-100 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 no-underline">
            {link.label}
          </Link>
        ))}
      </div>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
        <button type="submit" className="px-3 py-1.5 rounded-full border border-slate-200 text-[12px] text-slate-600">
          Sign out
        </button>
      </form>
    </div>
  );
}
