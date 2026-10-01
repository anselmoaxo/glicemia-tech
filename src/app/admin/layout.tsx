import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: { default: "Administração", template: "%s · Administração" }, robots: { index: false, follow: false } };

// Layout próprio: fora do grupo (app), sem navegação do usuário, sem assistente e sem telas de glicemia.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-1 flex-col md:flex-row">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3 focus:text-base focus:font-semibold"
      >
        Pular para o conteúdo
      </a>
      <AdminNav />
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
