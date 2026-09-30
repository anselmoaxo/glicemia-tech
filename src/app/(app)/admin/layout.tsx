import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Administração", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck aria-hidden className="size-6 text-primary" /> Administração
        </p>
        <nav aria-label="Administração" className="flex rounded-full bg-secondary p-1">
          <Link href="/admin" className="flex min-h-11 items-center rounded-full px-4 text-base font-semibold hover:bg-accent">
            Resumo
          </Link>
          <Link href="/admin/usuarios" className="flex min-h-11 items-center rounded-full px-4 text-base font-semibold hover:bg-accent">
            Usuários
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
