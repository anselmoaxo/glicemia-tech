import { cn } from "@/lib/utils";

/** Bloco cinza pulsante que ocupa o lugar do conteúdo enquanto a tela carrega. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-muted motion-reduce:animate-none", className)} />;
}

/** Tela de carregamento genérica: título, faixa de cartões e lista. Anunciada uma vez para leitores de tela. */
export function PageSkeleton({ cards = 0, rows = 5 }: { cards?: number; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando...</span>
      <Skeleton className="h-9 w-48 rounded-xl" />
      {cards > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
