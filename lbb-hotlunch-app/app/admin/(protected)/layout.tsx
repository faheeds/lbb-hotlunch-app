import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-700">Local Bigger Burger</p>
            <p className="text-[14px] font-semibold text-ink">Admin — Medina Academy</p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ink text-white">Staff</span>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-5">
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
