import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col gap-3">
        <Logo size="lg" />
        <p className="text-lg text-muted-foreground">Seu caderno de glicemia, simples de usar todos os dias.</p>
      </div>
      <div className="rounded-3xl border bg-card p-5 sm:p-6">{children}</div>
      <p className="text-center text-base text-muted-foreground">
        <a href="/politica-de-privacidade" className="underline underline-offset-4">Política de Privacidade</a>
      </p>
    </main>
  );
}
